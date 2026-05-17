package com.buddyfeast.service;

import com.buddyfeast.dto.CreateOrderRequest;
import com.buddyfeast.dto.OrderDTO;
import com.buddyfeast.entity.*;
import com.buddyfeast.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RiderRepository riderRepository;
    
    public OrderDTO createOrder(CreateOrderRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Order order = Order.builder()
            .orderNumber("#BF-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
            .user(user)
            .deliveryAddress(request.getDeliveryAddress())
            .customerPhone(request.getCustomerPhone())
            .specialNotes(request.getSpecialNotes())
            .status(Order.OrderStatus.NEW)
            .build();
        
        Double total = 0.0;
        List<OrderItem> items = request.getItems().stream().map(itemReq -> {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
            
            OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(itemReq.getQuantity())
                .price(product.getPrice())
                .customizations(itemReq.getCustomizations())
                .build();
            
            return item;
        }).collect(Collectors.toList());
        
        total = items.stream()
            .mapToDouble(item -> item.getPrice() * item.getQuantity())
            .sum();
        
        order.setItems(items);
        order.setSubtotal(total);
        order.setTotal(total);
        
        orderRepository.save(order);
        
        return convertToDTO(order);
    }
    
    public OrderDTO getOrderById(Long id) {
        return orderRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }
    
    public List<OrderDTO> getOrdersByUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return orderRepository.findByUser(user)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        return orderRepository.save(order);
    }
    
    public Order assignRider(Long orderId, Long riderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        Rider rider = riderRepository.findById(riderId)
            .orElseThrow(() -> new RuntimeException("Rider not found"));
        
        order.setRider(rider);
        order.setStatus(Order.OrderStatus.WITH_RIDER);
        return orderRepository.save(order);
    }
    
    private OrderDTO convertToDTO(Order order) {
        List<OrderDTO.OrderItemDTO> itemDTOs = order.getItems().stream()
            .map(item -> OrderDTO.OrderItemDTO.builder()
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .build())
            .collect(Collectors.toList());
        
        return OrderDTO.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .items(itemDTOs)
            .total(order.getTotal())
            .status(order.getStatus().toString())
            .deliveryAddress(order.getDeliveryAddress())
            .createdAt(order.getCreatedAt())
            .build();
    }
}
