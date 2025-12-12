package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 100)
    private String specification;

    @Column(length = 200)
    private String composition;

    @Column(length = 50)
    private String count;

    @Column(nullable = false, length = 20)
    private String unit = "kg";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductType type = ProductType.原料;

    @Column(name = "is_white_yarn")
    private Boolean isWhiteYarn = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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

    public enum ProductType {
        原料, 半成品, 成品
    }
}

