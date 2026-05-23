package com.buddyfeast.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long id;
    private String name;
    @Size(max = 255, message = "Description must be 255 characters or less")
    private String description;
    private Double price;
    private Long categoryId;
    private String category;
    private String imageUrl;
    private Double priceSmall;
    private Double priceMedium;
    private Double priceLarge;
    private String labelSmall;
    private String labelMedium;
    private String labelLarge;
    private Double discountPct;
    private Double discountAmount;
    private String sizesJson;
    private Boolean isAvailable;
    private Boolean isHot;
    private Boolean hasSizes;
}
