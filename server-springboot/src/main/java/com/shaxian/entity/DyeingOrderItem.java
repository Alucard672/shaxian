package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dyeing_order_items")
@Data
public class DyeingOrderItem {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "target_color_id", nullable = false, length = 50)
    private String targetColorId;

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

