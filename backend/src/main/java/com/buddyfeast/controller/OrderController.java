package com.buddyfeast.controller;

import com.buddyfeast.dto.CreateOrderRequest;
import com.buddyfeast.dto.OrderDTO;
import com.buddyfeast.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request, 1L)); // TODO: get user ID from JWT
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
        return ResponseEntity.ok(orderService.getOrdersByUser(1L)); // TODO: get user ID from JWT
    }
}
