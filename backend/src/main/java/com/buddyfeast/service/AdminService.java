package com.buddyfeast.service;

import com.buddyfeast.dto.DashboardMetricsDTO;
import com.buddyfeast.entity.Order;
import com.buddyfeast.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Service
public class AdminService {
    
    @Autowired
    private OrderRepository orderRepository;
    
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
