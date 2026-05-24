package com.buddyfeast.controller;

import com.buddyfeast.dto.*;
import com.buddyfeast.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── Customer ─────────────────────────────────────────────────────────────

    @PostMapping("/customer/register")
    public ResponseEntity<InitiateRegistrationResponse> registerCustomer(
            @Valid @RequestBody InitiateRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.initiateCustomerRegistration(request));
    }

    @PostMapping("/customer/verify-otp")
    public ResponseEntity<AuthResponse> verifyCustomerOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyCustomerRegistration(request));
    }

    @PostMapping("/customer/resend-otp")
    public ResponseEntity<InitiateRegistrationResponse> resendCustomerOtp(
            @Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendCustomerOtp(request));
    }

    @PostMapping("/customer/login")
    public ResponseEntity<AuthResponse> loginCustomer(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCustomer(request));
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @PostMapping("/admin/register")
    public ResponseEntity<AuthResponse> registerAdmin(@Valid @RequestBody AdminRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerAdmin(request));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> loginAdmin(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginAdmin(request));
    }

    // ─── Rider ────────────────────────────────────────────────────────────────

    @PostMapping("/rider/login")
    public ResponseEntity<AuthResponse> loginRider(@Valid @RequestBody RiderLoginRequest request) {
        return ResponseEntity.ok(authService.loginRider(request));
    }
}
