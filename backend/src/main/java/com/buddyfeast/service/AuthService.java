package com.buddyfeast.service;

import com.buddyfeast.dto.*;
import com.buddyfeast.entity.Admin;
import com.buddyfeast.entity.Rider;
import com.buddyfeast.entity.User;
import com.buddyfeast.repository.AdminRepository;
import com.buddyfeast.repository.RiderRepository;
import com.buddyfeast.repository.UserRepository;
import com.buddyfeast.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    public AuthResponse registerAdmin(AdminRegisterRequest request) {
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Admin email already registered");
        }
        
        Admin admin = Admin.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole() != null ? request.getRole() : Admin.AdminRole.OWNER)
            .build();
        
        adminRepository.save(admin);
        
        String token = jwtUtil.generateToken(admin.getEmail(), "ADMIN");
        
        return AuthResponse.builder()
            .token(token)
            .message("Admin registration successful")
            .build();
    }
    
    public AuthResponse registerCustomer(RegisterRequest request) {
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Phone already registered");
        }
        
        User user = User.builder()
            .name(request.getName())
            .phone(request.getPhone())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .address(request.getAddress())
            .city(request.getCity())
            .build();
        
        userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getPhone(), "CUSTOMER");
        
        UserDTO userDTO = UserDTO.builder()
            .id(user.getId())
            .name(user.getName())
            .phone(user.getPhone())
            .email(user.getEmail())
            .address(user.getAddress())
            .build();
        
        return AuthResponse.builder()
            .token(token)
            .message("Registration successful")
            .user(userDTO)
            .build();
    }
    
    public AuthResponse loginCustomer(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhoneOrEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        String token = jwtUtil.generateToken(user.getPhone(), "CUSTOMER");
        
        UserDTO userDTO = UserDTO.builder()
            .id(user.getId())
            .name(user.getName())
            .phone(user.getPhone())
            .email(user.getEmail())
            .address(user.getAddress())
            .build();
        
        return AuthResponse.builder()
            .token(token)
            .message("Login successful")
            .user(userDTO)
            .build();
    }
    
    public AuthResponse loginAdmin(LoginRequest request) {
        Admin admin = adminRepository.findByEmail(request.getPhoneOrEmail())
            .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        String token = jwtUtil.generateToken(admin.getEmail(), "ADMIN");
        
        return AuthResponse.builder()
            .token(token)
            .message("Admin login successful")
            .build();
    }
    
    public AuthResponse loginRider(RiderLoginRequest request) {
        Rider rider = riderRepository.findByRiderId(request.getRiderId())
            .orElseThrow(() -> new RuntimeException("Rider not found"));
        
        if (!passwordEncoder.matches(request.getPin(), rider.getPin())) {
            throw new RuntimeException("Invalid PIN");
        }
        
        String token = jwtUtil.generateToken(rider.getRiderId(), "RIDER");
        
        return AuthResponse.builder()
            .token(token)
            .message("Rider login successful")
            .build();
    }
}
