package com.buddyfeast.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "riders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String riderId;
    private String phone;
    private String pin;
    
    @Enumerated(EnumType.STRING)
    private RiderStatus status;
    
    private Integer completedOrders = 0;
    private Double rating = 5.0;
    
    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum RiderStatus {
        OFFLINE, ONLINE, ON_DELIVERY
    }
}
