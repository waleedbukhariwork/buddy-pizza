package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubCategoryDTO {
    private Long id;
    private String name;
    private Integer displayOrder;
    private Boolean isActive;
    private Long categoryId;
    private String categoryName;
    private long productCount;
}
