package com.buddyfeast.service;

import com.buddyfeast.dto.AdminProfileDTO;
import com.buddyfeast.dto.DashboardMetricsDTO;
import com.buddyfeast.dto.UpdateAdminPasswordRequest;
import com.buddyfeast.dto.UpdateAdminProfileRequest;
import com.buddyfeast.entity.Admin;
import com.buddyfeast.entity.Order;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.AdminRepository;
import com.buddyfeast.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OrderRepository orderRepository;

    public AdminProfileDTO getProfile(String email) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin not found"));
        return toProfileDTO(admin);
    }

    public AdminProfileDTO updateProfile(String email, UpdateAdminProfileRequest request) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin not found"));
        if (request.getName() != null) {
            admin.setName(request.getName());
        }
        if (request.getAvatarUrl() != null) {
            admin.setAvatarUrl(request.getAvatarUrl());
        }
        adminRepository.save(admin);
        return toProfileDTO(admin);
    }

    public void updatePassword(String email, UpdateAdminPasswordRequest request) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new AppException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
    }

    private AdminProfileDTO toProfileDTO(Admin admin) {
        return AdminProfileDTO.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .avatarUrl(admin.getAvatarUrl())
                .role(admin.getRole().name())
                .build();
    }

    public DashboardMetricsDTO getDashboardMetrics() {
        List<Order> allOrders = orderRepository.findAll();
        List<Order> newOrders = orderRepository.findByStatus(Order.OrderStatus.NEW);
        
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        double salesToday = allOrders.stream()
            .filter(o -> o.getCreatedAt().isAfter(startOfDay) && o.getCreatedAt().isBefore(endOfDay))
            .mapToDouble(Order::getTotal)
            .sum();
        
        double avgOrderValue = allOrders.isEmpty() ? 0 : 
            allOrders.stream()
                .mapToDouble(Order::getTotal)
                .average()
                .orElse(0.0);
        
        long deliveredToday = allOrders.stream()
            .filter(o -> o.getCreatedAt().isAfter(startOfDay) && 
                        o.getCreatedAt().isBefore(endOfDay) && 
                        o.getStatus() == Order.OrderStatus.DELIVERED)
            .count();
        
        List<Integer> sparklineData = Arrays.asList(12, 18, 22, 19, 26, 31, 28, 35, 42, 38, 44, 51, 48, 56);
        
        return DashboardMetricsDTO.builder()
            .activeOrders(newOrders.size())
            .salesToday(salesToday)
            .avgOrderValue(avgOrderValue)
            .deliveredToday((int) deliveredToday)
            .sparklineData(sparklineData)
            .build();
    }
}
