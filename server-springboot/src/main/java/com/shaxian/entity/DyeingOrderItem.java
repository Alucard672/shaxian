package com.shaxian.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dyeing_order_items")
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

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getTargetColorId() {
        return targetColorId;
    }

    public void setTargetColorId(String targetColorId) {
        this.targetColorId = targetColorId;
    }

    public String getTargetColorCode() {
        return targetColorCode;
    }

    public void setTargetColorCode(String targetColorCode) {
        this.targetColorCode = targetColorCode;
    }

    public String getTargetColorName() {
        return targetColorName;
    }

    public void setTargetColorName(String targetColorName) {
        this.targetColorName = targetColorName;
    }

    public String getTargetColorValue() {
        return targetColorValue;
    }

    public void setTargetColorValue(String targetColorValue) {
        this.targetColorValue = targetColorValue;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}

