package com.shaxian.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "print_templates")
public class PrintTemplate {
    @Id
    @Column(length = 50)
    private String id;

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

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public TemplateType getType() {
        return type;
    }

    public void setType(TemplateType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean isIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getPageSettings() {
        return pageSettings;
    }

    public void setPageSettings(String pageSettings) {
        this.pageSettings = pageSettings;
    }

    public String getTitleSettings() {
        return titleSettings;
    }

    public void setTitleSettings(String titleSettings) {
        this.titleSettings = titleSettings;
    }

    public String getBasicInfoFields() {
        return basicInfoFields;
    }

    public void setBasicInfoFields(String basicInfoFields) {
        this.basicInfoFields = basicInfoFields;
    }

    public String getProductFields() {
        return productFields;
    }

    public void setProductFields(String productFields) {
        this.productFields = productFields;
    }

    public String getSummaryFields() {
        return summaryFields;
    }

    public void setSummaryFields(String summaryFields) {
        this.summaryFields = summaryFields;
    }

    public String getOtherElements() {
        return otherElements;
    }

    public void setOtherElements(String otherElements) {
        this.otherElements = otherElements;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}

