package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "dyeing_order_items")
public class DyeingOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "target_color_id", nullable = false)
    private Long targetColorId;

    @Column(name = "target_color_code", nullable = false, length = 50)
    private String targetColorCode;

    @Column(name = "target_color_name", nullable = false, length = 100)
    private String targetColorName;

    @Column(name = "target_color_value", length = 20)
    private String targetColorValue;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

