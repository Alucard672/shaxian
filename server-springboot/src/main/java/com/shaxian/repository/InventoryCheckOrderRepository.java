package com.shaxian.repository;

import com.shaxian.entity.InventoryCheckOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryCheckOrderRepository extends JpaRepository<InventoryCheckOrder, String> {
    @Query("SELECT ico FROM InventoryCheckOrder ico WHERE " +
           "(:status IS NULL OR CAST(ico.status AS string) = :status) AND " +
           "(:warehouse IS NULL OR ico.warehouse = :warehouse) " +
           "ORDER BY ico.createdAt DESC")
    List<InventoryCheckOrder> findByFilters(@Param("status") String status, @Param("warehouse") String warehouse);
}

