package com.buddyfeast.controller;

import com.buddyfeast.dto.*;
import com.buddyfeast.service.AuthService;
import lombok.RequiredArgsConstructor;
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
            @RequestBody InitiateRegistrationRequest request) {
        return ResponseEntity.ok(authService.initiateCustomerRegistration(request));
    }

    @PostMapping("/customer/verify-otp")
    public ResponseEntity<AuthResponse> verifyCustomerOtp(@RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyCustomerRegistration(request));
    }

    @PostMapping("/customer/resend-otp")
    public ResponseEntity<InitiateRegistrationResponse> resendCustomerOtp(
            @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendCustomerOtp(request));
    }

    @PostMapping("/customer/login")
    public ResponseEntity<AuthResponse> loginCustomer(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCustomer(request));
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @PostMapping("/admin/register")
    public ResponseEntity<AuthResponse> registerAdmin(@RequestBody AdminRegisterRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> loginAdmin(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginAdmin(request));
    }

    // ─── Rider ────────────────────────────────────────────────────────────────

    @PostMapping("/rider/login")
    public ResponseEntity<AuthResponse> loginRider(@RequestBody RiderLoginRequest request) {
        return ResponseEntity.ok(authService.loginRider(request));
    }
}
