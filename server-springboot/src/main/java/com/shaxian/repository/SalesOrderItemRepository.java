package com.shaxian.repository;

import com.shaxian.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {
    List<SalesOrderItem> findByOrderId(Long orderId);
    void deleteByOrderId(Long orderId);
}

