package com.buddyfeast.controller;

import com.buddyfeast.dto.CreateOrderRequest;
import com.buddyfeast.dto.OrderDTO;
import com.buddyfeast.entity.User;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.UserRepository;
import com.buddyfeast.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;
    
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        String principal = (String) auth.getPrincipal();
        boolean isEmail = principal.contains("@");
        User user = (isEmail ? userRepository.findByEmail(principal) : userRepository.findByPhone(principal))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getId();
    }
    
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request, getAuthenticatedUserId()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getCurrentCustomerOrders() {
        return ResponseEntity.ok(orderService.getOrdersByUser(getAuthenticatedUserId()));
    }
}
