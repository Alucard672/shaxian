package com.shaxian.repository;

import com.shaxian.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, String> {
    @Query("SELECT so FROM SalesOrder so WHERE " +
           "(:status IS NULL OR CAST(so.status AS string) = :status) AND " +
           "(:customerId IS NULL OR so.customerId = :customerId) AND " +
           "(:startDate IS NULL OR so.salesDate >= :startDate) AND " +
           "(:endDate IS NULL OR so.salesDate <= :endDate) " +
           "ORDER BY so.createdAt DESC")
    List<SalesOrder> findByFilters(@Param("status") String status,
                                   @Param("customerId") String customerId,
                                   @Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate);
}

