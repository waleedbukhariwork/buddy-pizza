package com.buddyfeast.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private List<OrderItemRequest> items;
    private String deliveryAddress;
    private String customerPhone;
    private String specialNotes;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private String customizations;
    }
}
