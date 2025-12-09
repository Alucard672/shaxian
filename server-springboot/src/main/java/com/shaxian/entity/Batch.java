package com.shaxian.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Batch {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "color_id", nullable = false, length = 50)
    private String colorId;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "production_date")
    private LocalDate productionDate;

    @Column(name = "supplier_id", length = 50)
    private String supplierId;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "stock_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "initial_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal initialQuantity = BigDecimal.ZERO;

    @Column(name = "stock_location", length = 100)
    private String stockLocation;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", insertable = false, updatable = false)
    @JsonIgnore
    private Color color;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (stockQuantity == null) {
            stockQuantity = initialQuantity != null ? initialQuantity : BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

