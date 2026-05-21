package com.buddyfeast.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private Double price;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    
    private String imageUrl;

    private Double priceSmall;
    private Double priceMedium;
    private Double priceLarge;

    private String labelSmall;
    private String labelMedium;
    private String labelLarge;

    private Double discountPct;
    private Double discountAmount;

    @Column(columnDefinition = "TEXT")
    private String sizesJson;

    private Boolean isAvailable = true;
    private Boolean isHot = false;
    private Boolean hasSizes = false;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
