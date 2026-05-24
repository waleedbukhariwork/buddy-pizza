package com.buddyfeast.controller;

import com.buddyfeast.dto.ChangePasswordRequest;
import com.buddyfeast.dto.UpdateProfileRequest;
import com.buddyfeast.dto.UserDTO;
import com.buddyfeast.entity.User;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getProfile(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(toDTO(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest req) {
        User user = resolveUser(authentication);
        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        userRepository.save(user);
        return ResponseEntity.ok(toDTO(user));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest req) {
        User user = resolveUser(authentication);
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    private User resolveUser(Authentication authentication) {
        String identifier = authentication.getName();
        boolean isEmail = identifier.contains("@");
        return (isEmail
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhone(identifier))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .address(user.getAddress())
                .build();
    }
}
