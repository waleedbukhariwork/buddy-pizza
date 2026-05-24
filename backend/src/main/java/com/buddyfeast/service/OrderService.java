package com.buddyfeast.service;

import com.buddyfeast.dto.CreateOrderRequest;
import com.buddyfeast.dto.OrderDTO;
import com.buddyfeast.entity.*;
import com.buddyfeast.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
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
    private DealRepository dealRepository;

    @Autowired
    private RiderRepository riderRepository;

    @Autowired
    private PromoCodeService promoCodeService;

    @Autowired
    private EmailService emailService;

    public OrderDTO createOrder(CreateOrderRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate promo code before processing items (fail fast)
        double promoDiscount = 0.0;
        String appliedPromo = null;
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            PromoCodeService.PromoResult promo = promoCodeService.validate(request.getPromoCode(), 0);
            if (promo.isValid()) {
                appliedPromo = request.getPromoCode().trim().toUpperCase();
            }
        }

        Order order = Order.builder()
            .orderNumber("#BF-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
            .user(user)
            .deliveryAddress(request.getDeliveryAddress())
            .customerPhone(request.getCustomerPhone())
            .specialNotes(request.getSpecialNotes())
            .promoCode(appliedPromo)
            .status(Order.OrderStatus.NEW)
            .build();

        LocalDateTime now = LocalDateTime.now();
        List<OrderItem> items = request.getItems().stream().map(itemReq -> {
            if (itemReq.getDealId() != null) {
                Deal deal = dealRepository.findById(itemReq.getDealId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal not found"));

                if (Boolean.FALSE.equals(deal.getIsActive()))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal '" + deal.getTitle() + "' is no longer active");
                if (deal.getExpiresAt() != null && !now.isBefore(deal.getExpiresAt()))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal '" + deal.getTitle() + "' has expired");
                if (deal.getMaxOrders() != null && deal.getOrdersCount() != null && deal.getOrdersCount() >= deal.getMaxOrders())
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal '" + deal.getTitle() + "' is sold out");

                deal.setOrdersCount(deal.getOrdersCount() + itemReq.getQuantity());
                dealRepository.save(deal);

                double price = itemReq.getPrice() != null ? itemReq.getPrice() : (deal.getDiscountPrice() != null ? deal.getDiscountPrice() : 0.0);
                return OrderItem.builder()
                    .order(order)
                    .dealId(deal.getId())
                    .itemName(deal.getTitle())
                    .quantity(itemReq.getQuantity())
                    .price(price)
                    .customizations(itemReq.getCustomizations())
                    .build();
            } else {
                Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
                double price = itemReq.getPrice() != null ? itemReq.getPrice() : product.getPrice();
                return OrderItem.builder()
                    .order(order)
                    .product(product)
                    .itemName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .price(price)
                    .customizations(itemReq.getCustomizations())
                    .build();
            }
        }).collect(Collectors.toList());

        double subtotal = items.stream()
            .mapToDouble(item -> item.getPrice() * item.getQuantity())
            .sum();

        // Re-validate promo with actual subtotal for percentage-based codes
        double discount = 0.0;
        if (appliedPromo != null) {
            PromoCodeService.PromoResult promo = promoCodeService.validate(appliedPromo, subtotal);
            if (promo.isValid()) {
                discount = promo.getDiscount();
            }
        }

        double total = Math.max(0, subtotal - discount);

        order.setItems(items);
        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setDeliveryFee(0.0);
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

        Order.OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        if (previousStatus != status) {
            sendOrderStatusUpdateEmail(savedOrder, previousStatus, status);
        }

        return savedOrder;
    }
    
    public Order assignRider(Long orderId, Long riderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        Rider rider = riderRepository.findById(riderId)
            .orElseThrow(() -> new RuntimeException("Rider not found"));

        Order.OrderStatus previousStatus = order.getStatus();
        order.setRider(rider);
        order.setStatus(Order.OrderStatus.WITH_RIDER);
        Order savedOrder = orderRepository.save(order);

        if (previousStatus != Order.OrderStatus.WITH_RIDER) {
            sendOrderStatusUpdateEmail(savedOrder, previousStatus, Order.OrderStatus.WITH_RIDER);
        }

        return savedOrder;
    }
    
    private OrderDTO convertToDTO(Order order) {
        List<OrderDTO.OrderItemDTO> itemDTOs = order.getItems().stream()
            .map(item -> {
                String productName = item.getProduct() != null ? item.getProduct().getName() : null;
                String displayName = item.getItemName() != null ? item.getItemName()
                    : (productName != null ? productName : "Item");
                return OrderDTO.OrderItemDTO.builder()
                    .id(item.getId())
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .dealId(item.getDealId())
                    .productName(productName)
                    .itemName(item.getItemName())
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .build();
            })
            .collect(Collectors.toList());
        
        return OrderDTO.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .items(itemDTOs)
            .subtotal(order.getSubtotal())
            .discount(order.getDiscount() != null ? order.getDiscount() : 0.0)
            .deliveryFee(order.getDeliveryFee() != null ? order.getDeliveryFee() : 0.0)
            .total(order.getTotal())
            .status(order.getStatus().toString())
            .deliveryAddress(order.getDeliveryAddress())
            .promoCode(order.getPromoCode())
            .createdAt(order.getCreatedAt())
            .build();
    }

    private void sendOrderStatusUpdateEmail(Order order, Order.OrderStatus previousStatus, Order.OrderStatus status) {
        User user = order.getUser();
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        List<String> itemSummaries = order.getItems().stream()
            .map(item -> {
                String productName = item.getProduct() != null ? item.getProduct().getName() : null;
                String displayName = item.getItemName() != null ? item.getItemName()
                    : (productName != null ? productName : "Item");
                return item.getQuantity() + " x " + displayName;
            })
            .collect(Collectors.toList());

        try {
            if (previousStatus == Order.OrderStatus.NEW && status == Order.OrderStatus.PREPARING) {
                emailService.sendOrderAcceptedEmail(
                    user.getEmail(),
                    user.getName(),
                    order.getOrderNumber(),
                    itemSummaries,
                    order.getTotal()
                );
            } else if (status == Order.OrderStatus.WITH_RIDER) {
                emailService.sendOrderOnRideEmail(
                    user.getEmail(),
                    user.getName(),
                    order.getOrderNumber(),
                    itemSummaries,
                    order.getTotal()
                );
            } else if (status == Order.OrderStatus.DELIVERED) {
                emailService.sendOrderDeliveredEmail(
                    user.getEmail(),
                    user.getName(),
                    order.getOrderNumber(),
                    itemSummaries,
                    order.getTotal()
                );
            }
        } catch (RuntimeException ignored) {
            // Email delivery should not block kitchen workflow updates.
        }
    }
}
