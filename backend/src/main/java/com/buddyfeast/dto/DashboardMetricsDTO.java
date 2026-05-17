package com.buddyfeast.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetricsDTO {
    private Integer activeOrders;
    private Double salesToday;
    private Double avgOrderValue;
    private Integer deliveredToday;
    private List<Integer> sparklineData;
}
