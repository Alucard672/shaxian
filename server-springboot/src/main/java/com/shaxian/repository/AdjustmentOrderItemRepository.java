package com.shaxian.repository;

import com.shaxian.entity.AdjustmentOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdjustmentOrderItemRepository extends JpaRepository<AdjustmentOrderItem, String> {
    List<AdjustmentOrderItem> findByOrderId(String orderId);
    void deleteByOrderId(String orderId);
}

