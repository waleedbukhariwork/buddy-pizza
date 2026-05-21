package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDTO {
    private Integer productId;
    private Integer dealId;
    private String productName;
    private Double price;
    private Integer quantity;
    private String size;
    private Double sizePrice;
    private String customizations;
}
