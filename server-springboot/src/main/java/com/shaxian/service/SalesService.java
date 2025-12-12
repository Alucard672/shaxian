package com.shaxian.service;

import com.shaxian.entity.Batch;
import com.shaxian.entity.SalesOrder;
import com.shaxian.entity.SalesOrderItem;
import com.shaxian.repository.BatchRepository;
import com.shaxian.repository.SalesOrderRepository;
import com.shaxian.repository.SalesOrderItemRepository;
import com.shaxian.util.OrderNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SalesService {
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final BatchRepository batchRepository;

    public SalesService(
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            BatchRepository batchRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.batchRepository = batchRepository;
    }


    public List<SalesOrder> getAllSales(String status, Long customerId, LocalDate startDate, LocalDate endDate) {
        return salesOrderRepository.findByFilters(status, customerId, startDate, endDate);
    }

    public Optional<SalesOrder> getSalesById(Long id) {
        Optional<SalesOrder> order = salesOrderRepository.findById(id);
        order.ifPresent(o -> o.setItems(salesOrderItemRepository.findByOrderId(id)));
        return order;
    }

    @Transactional
    public SalesOrder createSales(SalesOrder order, List<SalesOrderItem> items) {
        order.setOrderNumber(OrderNumberGenerator.generateSalesOrderNumber());
        
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getQuantity().multiply(item.getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal receivedAmount = order.getReceivedAmount() != null ? order.getReceivedAmount() : BigDecimal.ZERO;
        order.setTotalAmount(totalAmount);
        order.setReceivedAmount(receivedAmount);
        order.setUnpaidAmount(totalAmount.subtract(receivedAmount));
        
        SalesOrder saved = salesOrderRepository.save(order);
        
        for (SalesOrderItem item : items) {
            item.setOrderId(saved.getId());
            item.setAmount(item.getQuantity().multiply(item.getPrice()));
        }
        salesOrderItemRepository.saveAll(items);
        
        // 如果状态是已出库，减少库存
        if (order.getStatus() == SalesOrder.OrderStatus.已出库) {
            for (SalesOrderItem item : items) {
                batchRepository.decreaseStock(item.getBatchId(), item.getQuantity());
            }
        }
        
        saved.setItems(items);
        return saved;
    }

    @Transactional
    public SalesOrder updateSales(Long id, SalesOrder order, List<SalesOrderItem> items) {
        SalesOrder existing = salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("销售单不存在"));
        
        if (existing.getStatus() != SalesOrder.OrderStatus.草稿) {
            throw new IllegalArgumentException("只能修改草稿状态的订单");
        }
        
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getQuantity().multiply(item.getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal receivedAmount = order.getReceivedAmount() != null ? order.getReceivedAmount() : BigDecimal.ZERO;
        order.setId(id);
        order.setOrderNumber(existing.getOrderNumber());
        order.setTotalAmount(totalAmount);
        order.setReceivedAmount(receivedAmount);
        order.setUnpaidAmount(totalAmount.subtract(receivedAmount));
        order.setCreatedAt(existing.getCreatedAt());
        
        salesOrderItemRepository.deleteByOrderId(id);
        
        for (SalesOrderItem item : items) {
            item.setOrderId(id);
            item.setAmount(item.getQuantity().multiply(item.getPrice()));
        }
        salesOrderItemRepository.saveAll(items);
        
        SalesOrder saved = salesOrderRepository.save(order);
        saved.setItems(items);
        return saved;
    }

    @Transactional
    public void deleteSales(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("销售单不存在"));
        
        if (order.getStatus() != SalesOrder.OrderStatus.草稿) {
            throw new IllegalArgumentException("只能删除草稿状态的订单");
        }
        
        salesOrderRepository.deleteById(id);
    }
}

