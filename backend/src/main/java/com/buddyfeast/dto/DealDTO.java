package com.buddyfeast.dto;

import lombok.*;

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
    private Boolean isActive;
}
