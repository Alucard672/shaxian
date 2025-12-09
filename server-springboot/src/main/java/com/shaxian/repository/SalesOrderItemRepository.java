package com.shaxian.repository;

import com.shaxian.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, String> {
    List<SalesOrderItem> findByOrderId(String orderId);
    void deleteByOrderId(String orderId);
}

