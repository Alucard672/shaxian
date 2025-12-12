package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_check_items")
public class InventoryCheckItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "color_id", nullable = false)
    private Long colorId;

    @Column(name = "color_name", nullable = false, length = 100)
    private String colorName;

    @Column(name = "color_code", nullable = false, length = 50)
    private String colorCode;

    @Column(name = "system_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal systemQuantity;

    @Column(name = "actual_quantity", precision = 10, scale = 2)
    private BigDecimal actualQuantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal difference;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

