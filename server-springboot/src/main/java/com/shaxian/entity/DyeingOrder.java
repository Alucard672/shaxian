package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "dyeing_orders")
public class DyeingOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "grey_batch_id", nullable = false)
    private Long greyBatchId;

    @Column(name = "grey_batch_code", nullable = false, length = 50)
    private String greyBatchCode;

    @Column(name = "factory_id")
    private Long factoryId;

    @Column(name = "factory_name", nullable = false, length = 200)
    private String factoryName;

    @Column(name = "factory_phone", length = 50)
    private String factoryPhone;

    @Column(name = "shipment_date", nullable = false)
    private LocalDate shipmentDate;

    @Column(name = "expected_completion_date", nullable = false)
    private LocalDate expectedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Column(name = "processing_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal processingPrice;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.待发货;

    @Column(length = 100)
    private String operator;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DyeingOrderItem> items;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OrderStatus {
        待发货, 加工中, 已完成, 已入库, 已取消
    }
}

