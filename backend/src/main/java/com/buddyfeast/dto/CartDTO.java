package com.buddyfeast.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartDTO {
    private Long userId;
    private List<CartItemDTO> items;
    private Double total;
    private LocalDateTime updatedAt;
}
