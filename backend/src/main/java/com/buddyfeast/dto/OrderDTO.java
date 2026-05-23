package com.buddyfeast.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private List<OrderItemDTO> items;
    private Double total;
    private String status;
    private String deliveryAddress;
    private LocalDateTime createdAt;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDTO {
        private Long id;
        private Long productId;
        private Long dealId;
        private String productName;
        private String itemName;
        private Integer quantity;
        private Double price;
    }
}
