package com.shaxian.repository;

import com.shaxian.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:status IS NULL OR CAST(po.status AS string) = :status) AND " +
           "(:supplierId IS NULL OR po.supplierId = :supplierId) AND " +
           "(:startDate IS NULL OR po.purchaseDate >= :startDate) AND " +
           "(:endDate IS NULL OR po.purchaseDate <= :endDate) " +
           "ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByFilters(@Param("status") String status,
                                      @Param("supplierId") Long supplierId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);
}

