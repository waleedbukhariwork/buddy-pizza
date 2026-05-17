package com.buddyfeast.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String icon;
    private Integer displayOrder;
    private Boolean isActive = true;
    
    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
}
