package com.shaxian.repository;

import com.shaxian.entity.CustomQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomQueryRepository extends JpaRepository<CustomQuery, String> {
    @Query("SELECT cq FROM CustomQuery cq WHERE " +
           "(:module IS NULL OR cq.module = :module) " +
           "ORDER BY cq.createdAt DESC")
    List<CustomQuery> findByModule(@Param("module") String module);
}

