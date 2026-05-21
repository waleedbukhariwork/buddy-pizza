package com.buddyfeast.service;

import com.buddyfeast.dto.*;
import com.buddyfeast.entity.Admin;
import com.buddyfeast.entity.OtpRecord;
import com.buddyfeast.entity.Rider;
import com.buddyfeast.entity.User;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.AdminRepository;
import com.buddyfeast.repository.RiderRepository;
import com.buddyfeast.repository.UserRepository;
import com.buddyfeast.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_REGEX =
            Pattern.compile("^(\\+92|92|0)?3[0-9]{9}$");

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final RiderRepository riderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    // ─── Customer registration ────────────────────────────────────────────────

    @Transactional
    public InitiateRegistrationResponse initiateCustomerRegistration(InitiateRegistrationRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        boolean isEmail = identifier.contains("@");
        OtpRecord.IdentifierType type;

        if (isEmail) {
            if (!EMAIL_REGEX.matcher(identifier).matches()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Invalid email address");
            }
            type = OtpRecord.IdentifierType.EMAIL;
        } else {
            String normalized = identifier.replaceAll("[\\s\\-]", "");
            if (!PHONE_REGEX.matcher(normalized).matches()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Invalid phone number. Use format: 03001234567 or +923001234567");
            }
            identifier = normalized;
            type = OtpRecord.IdentifierType.PHONE;
        }

        // Reject if a verified account already owns this identifier
        final String finalIdentifier = identifier;
        if (isEmail) {
            userRepository.findByEmail(finalIdentifier)
                    .filter(User::isVerified)
                    .ifPresent(u -> { throw new AppException(HttpStatus.CONFLICT, "Email already registered"); });
        } else {
            userRepository.findByPhone(finalIdentifier)
                    .filter(User::isVerified)
                    .ifPresent(u -> { throw new AppException(HttpStatus.CONFLICT, "Phone already registered"); });
        }

        // Remove any previous unverified record for this identifier so we can replace it
        if (isEmail) {
            userRepository.findByEmail(finalIdentifier)
                    .filter(u -> !u.isVerified())
                    .ifPresent(userRepository::delete);
        } else {
            userRepository.findByPhone(finalIdentifier)
                    .filter(u -> !u.isVerified())
                    .ifPresent(userRepository::delete);
        }

        User user = User.builder()
                .name(request.getName().trim())
                .phone(isEmail ? null : finalIdentifier)
                .email(isEmail ? finalIdentifier : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .verified(false)
                .build();
        userRepository.save(user);

        otpService.generateAndSendOtp(finalIdentifier, type);

        String destination = isEmail ? "your email address" : "your phone number";
        return InitiateRegistrationResponse.builder()
                .identifier(finalIdentifier)
                .identifierType(type.name())
                .message("A 6-digit code has been sent to " + destination)
                .build();
    }

    @Transactional
    public AuthResponse verifyCustomerRegistration(OtpVerifyRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        otpService.verifyOtp(identifier, request.getCode());

        boolean isEmail = identifier.contains("@");
        User user = (isEmail
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhone(identifier))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isVerified()) {
            throw new AppException(HttpStatus.CONFLICT, "Account already verified");
        }

        user.setVerified(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(identifier, "CUSTOMER");

        return AuthResponse.builder()
                .token(token)
                .message("Account verified. Welcome!")
                .user(toUserDTO(user))
                .build();
    }

    @Transactional
    public InitiateRegistrationResponse resendCustomerOtp(ResendOtpRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        boolean isEmail = identifier.contains("@");
        OtpRecord.IdentifierType type = isEmail
                ? OtpRecord.IdentifierType.EMAIL
                : OtpRecord.IdentifierType.PHONE;

        User user = (isEmail
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhone(identifier))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isVerified()) {
            throw new AppException(HttpStatus.CONFLICT, "Account is already verified");
        }

        otpService.generateAndSendOtp(identifier, type);

        String destination = isEmail ? "your email address" : "your phone number";
        return InitiateRegistrationResponse.builder()
                .identifier(identifier)
                .identifierType(type.name())
                .message("A new code has been sent to " + destination)
                .build();
    }

    // ─── Customer login ───────────────────────────────────────────────────────

    public AuthResponse loginCustomer(LoginRequest request) {
        String phoneOrEmail = request.getPhoneOrEmail() != null ? request.getPhoneOrEmail().trim() : "";
        boolean isEmail = phoneOrEmail.contains("@");

        User user = (isEmail
                ? userRepository.findByEmail(phoneOrEmail)
                : userRepository.findByPhone(phoneOrEmail))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "No account found with that phone or email"));

        if (!user.isVerified()) {
            throw new AppException(HttpStatus.FORBIDDEN, "UNVERIFIED");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        String identifier = user.getPhone() != null ? user.getPhone() : user.getEmail();
        String token = jwtUtil.generateToken(identifier, "CUSTOMER");

        return AuthResponse.builder()
                .token(token)
                .message("Login successful")
                .user(toUserDTO(user))
                .build();
    }

    // ─── Admin auth ───────────────────────────────────────────────────────────

    public AuthResponse registerAdmin(AdminRegisterRequest request) {
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Admin email already registered");
        }

        Admin admin = Admin.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Admin.AdminRole.OWNER)
                .build();
        adminRepository.save(admin);

        String token = jwtUtil.generateToken(admin.getEmail(), "ADMIN");
        return AuthResponse.builder().token(token).message("Admin registration successful").build();
    }

    public AuthResponse loginAdmin(LoginRequest request) {
        Admin admin = adminRepository.findByEmail(request.getPhoneOrEmail())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin not found"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        String token = jwtUtil.generateToken(admin.getEmail(), "ADMIN");
        return AuthResponse.builder().token(token).message("Admin login successful").build();
    }

    // ─── Rider auth ───────────────────────────────────────────────────────────

    public AuthResponse loginRider(RiderLoginRequest request) {
        Rider rider = riderRepository.findByRiderId(request.getRiderId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rider not found"));

        if (!passwordEncoder.matches(request.getPin(), rider.getPin())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Incorrect PIN");
        }

        String token = jwtUtil.generateToken(rider.getRiderId(), "RIDER");
        return AuthResponse.builder().token(token).message("Rider login successful").build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .address(user.getAddress())
                .build();
    }
}
