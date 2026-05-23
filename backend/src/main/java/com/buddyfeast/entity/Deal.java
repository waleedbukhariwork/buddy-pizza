package com.buddyfeast.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String tag;
    private Double originalPrice;
    private Double discountPrice;
    private String badge;

    @Column(columnDefinition = "TEXT")
    private String items;

    private Boolean isActive = true;
    private Boolean isFeatured = false;
    private Boolean deleted = false;

    // Image & content
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String termsText;

    // Scheduling
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;

    // Quota / ordering
    private Integer maxOrders;
    private Integer ordersCount = 0;
    private Integer displayOrder = 0;

    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (ordersCount == null) ordersCount = 0;
        if (displayOrder == null) displayOrder = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
