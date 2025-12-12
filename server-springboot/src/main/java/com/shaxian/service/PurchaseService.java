package com.shaxian.service;

import com.shaxian.entity.PurchaseOrder;
import com.shaxian.entity.PurchaseOrderItem;
import com.shaxian.repository.PurchaseOrderRepository;
import com.shaxian.repository.PurchaseOrderItemRepository;
import com.shaxian.util.OrderNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseService {
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;

    public PurchaseService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
    }


    public List<PurchaseOrder> getAllPurchases(String status, Long supplierId, LocalDate startDate, LocalDate endDate) {
        return purchaseOrderRepository.findByFilters(status, supplierId, startDate, endDate);
    }

    public Optional<PurchaseOrder> getPurchaseById(Long id) {
        Optional<PurchaseOrder> order = purchaseOrderRepository.findById(id);
        order.ifPresent(o -> o.setItems(purchaseOrderItemRepository.findByOrderId(id)));
        return order;
    }

    @Transactional
    public PurchaseOrder createPurchase(PurchaseOrder order, List<PurchaseOrderItem> items) {
        order.setOrderNumber(OrderNumberGenerator.generatePurchaseOrderNumber());
        
        // 计算总金额
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getQuantity().multiply(item.getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal paidAmount = order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;
        order.setTotalAmount(totalAmount);
        order.setPaidAmount(paidAmount);
        order.setUnpaidAmount(totalAmount.subtract(paidAmount));
        
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        
        // 保存明细
        for (PurchaseOrderItem item : items) {
            item.setOrderId(saved.getId());
            item.setAmount(item.getQuantity().multiply(item.getPrice()));
        }
        purchaseOrderItemRepository.saveAll(items);
        
        saved.setItems(items);
        return saved;
    }

    @Transactional
    public PurchaseOrder updatePurchase(Long id, PurchaseOrder order, List<PurchaseOrderItem> items) {
        PurchaseOrder existing = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("进货单不存在"));
        
        if (existing.getStatus() != PurchaseOrder.OrderStatus.草稿) {
            throw new IllegalArgumentException("只能修改草稿状态的订单");
        }
        
        // 计算总金额
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getQuantity().multiply(item.getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal paidAmount = order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;
        order.setId(id);
        order.setOrderNumber(existing.getOrderNumber());
        order.setTotalAmount(totalAmount);
        order.setPaidAmount(paidAmount);
        order.setUnpaidAmount(totalAmount.subtract(paidAmount));
        order.setCreatedAt(existing.getCreatedAt());
        
        // 删除旧明细
        purchaseOrderItemRepository.deleteByOrderId(id);
        
        // 保存新明细
        for (PurchaseOrderItem item : items) {
            item.setOrderId(id);
            item.setAmount(item.getQuantity().multiply(item.getPrice()));
        }
        purchaseOrderItemRepository.saveAll(items);
        
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        saved.setItems(items);
        return saved;
    }

    @Transactional
    public void deletePurchase(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("进货单不存在"));
        
        if (order.getStatus() != PurchaseOrder.OrderStatus.草稿) {
            throw new IllegalArgumentException("只能删除草稿状态的订单");
        }
        
        purchaseOrderRepository.deleteById(id);
    }
}

