package com.buddyfeast.controller;

import com.buddyfeast.dto.*;
import com.buddyfeast.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/customer/register")
    public ResponseEntity<AuthResponse> registerCustomer(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerCustomer(request));
    }
    
    @PostMapping("/admin/register")
    public ResponseEntity<AuthResponse> registerAdmin(@RequestBody AdminRegisterRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }
    
    @PostMapping("/customer/login")
    public ResponseEntity<AuthResponse> loginCustomer(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCustomer(request));
    }
    
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> loginAdmin(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginAdmin(request));
    }
    
    @PostMapping("/rider/login")
    public ResponseEntity<AuthResponse> loginRider(@RequestBody RiderLoginRequest request) {
        return ResponseEntity.ok(authService.loginRider(request));
    }
}
