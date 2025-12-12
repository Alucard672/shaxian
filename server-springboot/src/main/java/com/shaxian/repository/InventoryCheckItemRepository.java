package com.shaxian.repository;

import com.shaxian.entity.InventoryCheckItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryCheckItemRepository extends JpaRepository<InventoryCheckItem, Long> {
    List<InventoryCheckItem> findByOrderId(Long orderId);
    void deleteByOrderId(Long orderId);
}

