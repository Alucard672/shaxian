package com.shaxian.repository;

import com.shaxian.entity.DyeingOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DyeingOrderItemRepository extends JpaRepository<DyeingOrderItem, String> {
    List<DyeingOrderItem> findByOrderId(String orderId);
    void deleteByOrderId(String orderId);
}

