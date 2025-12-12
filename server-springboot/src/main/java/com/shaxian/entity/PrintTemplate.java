package com.shaxian.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "print_templates")
public class PrintTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "page_settings", columnDefinition = "TEXT")
    private String pageSettings; // JSON 格式

    @Column(name = "title_settings", columnDefinition = "TEXT")
    private String titleSettings; // JSON 格式

    @Column(name = "basic_info_fields", columnDefinition = "TEXT")
    private String basicInfoFields; // JSON 格式

    @Column(name = "product_fields", columnDefinition = "TEXT")
    private String productFields; // JSON 格式

    @Column(name = "summary_fields", columnDefinition = "TEXT")
    private String summaryFields; // JSON 格式

    @Column(name = "other_elements", columnDefinition = "TEXT")
    private String otherElements; // JSON 格式

    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;

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

    public enum TemplateType {
        A4模板, 三联单
    }

    public enum DocumentType {
        销售单, 进货单
    }
}

