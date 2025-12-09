package com.shaxian.repository;

import com.shaxian.entity.PrintTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrintTemplateRepository extends JpaRepository<PrintTemplate, String> {
    @Query("SELECT pt FROM PrintTemplate pt WHERE " +
           "(:documentType IS NULL OR CAST(pt.documentType AS string) = :documentType) " +
           "ORDER BY pt.createdAt DESC")
    List<PrintTemplate> findByDocumentType(@Param("documentType") String documentType);
}

