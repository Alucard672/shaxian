package com.shaxian.repository;

import com.shaxian.entity.AdjustmentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdjustmentOrderRepository extends JpaRepository<AdjustmentOrder, String> {
    @Query("SELECT ao FROM AdjustmentOrder ao WHERE " +
           "(:status IS NULL OR CAST(ao.status AS string) = :status) AND " +
           "(:type IS NULL OR CAST(ao.type AS string) = :type) " +
           "ORDER BY ao.createdAt DESC")
    List<AdjustmentOrder> findByFilters(@Param("status") String status, @Param("type") String type);
}

