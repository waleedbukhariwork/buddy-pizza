package com.buddyfeast.controller;

import com.buddyfeast.entity.Order;
import com.buddyfeast.entity.Rider;
import com.buddyfeast.repository.OrderRepository;
import com.buddyfeast.service.RiderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/rider")
public class RiderController {
    
    @Autowired
    private RiderService riderService;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @GetMapping("/{id}")
    public ResponseEntity<Rider> getRiderById(@PathVariable Long id) {
        return ResponseEntity.ok(riderService.getRiderById(id));
    }
    
    @GetMapping("/{riderId}/orders")
    public ResponseEntity<List<Order>> getRiderOrders(@PathVariable Long riderId) {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getActiveRiderOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<Order> getRiderOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderRepository.findById(orderId).orElseThrow());
    }
    
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long orderId,
        @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(orderRepository.findById(orderId).map(order -> {
            order.setStatus(status);
            return orderRepository.save(order);
        }).orElseThrow());
    }
}
