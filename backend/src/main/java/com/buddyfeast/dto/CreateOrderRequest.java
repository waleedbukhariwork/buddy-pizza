package com.buddyfeast.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @NotNull(message = "Order items are required")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    private String specialNotes;
    private String promoCode;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        private Long productId;
        private Long dealId;
        private String itemName;

        @NotNull(message = "Price is required")
        private Double price;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private String customizations;
    }
}
