package com.buddyfeast.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealDTO {
    private Long id;
    private String title;
    private String description;
    private String tag;
    private Double originalPrice;
    private Double discountPrice;
    private String badge;
    private String items;
    private Boolean isActive;
    private Boolean isFeatured;

    // Image & content
    private String imageUrl;
    private String termsText;

    // Scheduling
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;

    // Quota / ordering
    private Integer maxOrders;
    private Integer ordersCount;
    private Integer displayOrder;
}
