package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_check_items")
@Data
public class InventoryCheckItem {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "batch_id", nullable = false, length = 50)
    private String batchId;

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(name = "product_id", nullable = false, length = 50)
    private String productId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "color_id", nullable = false, length = 50)
    private String colorId;

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

