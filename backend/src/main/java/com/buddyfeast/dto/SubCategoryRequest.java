package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubCategoryRequest {
    private Long categoryId;
    private String name;
    private Integer displayOrder;
    private Boolean isActive;
}
