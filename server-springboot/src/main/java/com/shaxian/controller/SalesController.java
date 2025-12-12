package com.shaxian.controller;

import com.shaxian.entity.Batch;
import com.shaxian.entity.SalesOrder;
import com.shaxian.entity.SalesOrderItem;
import com.shaxian.repository.BatchRepository;
import com.shaxian.service.SalesService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SalesController {
    private final SalesService salesService;
    private final BatchRepository batchRepository;

    public SalesController(
            SalesService salesService,
            BatchRepository batchRepository) {
        this.salesService = salesService;
        this.batchRepository = batchRepository;
    }


    @GetMapping
    public ResponseEntity<List<SalesOrder>> getAllSales(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<SalesOrder> orders = salesService.getAllSales(status, customerId, startDate, endDate);
        orders.forEach(order -> {
            List<SalesOrderItem> items = salesService.getSalesById(order.getId())
                    .map(SalesOrder::getItems)
                    .orElse(List.of());
            order.setItems(items);
        });
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrder> getSales(@PathVariable String id) {
        return salesService.getSalesById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createSales(@RequestBody Map<String, Object> request) {
        try {
            SalesOrder order = new SalesOrder();
            if (request.containsKey("customerId")) order.setCustomerId((String) request.get("customerId"));
            if (request.containsKey("customerName")) order.setCustomerName((String) request.get("customerName"));
            if (request.containsKey("salesDate")) order.setSalesDate(LocalDate.parse((String) request.get("salesDate")));
            if (request.containsKey("expectedDate")) order.setExpectedDate(LocalDate.parse((String) request.get("expectedDate")));
            if (request.containsKey("receivedAmount")) order.setReceivedAmount(new BigDecimal(request.get("receivedAmount").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("operator")) order.setOperator((String) request.get("operator"));
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                order.setStatus(SalesOrder.OrderStatus.valueOf(statusStr));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            List<SalesOrderItem> items = itemsData.stream().map(itemData -> {
                SalesOrderItem item = new SalesOrderItem();
                if (itemData.containsKey("productId")) item.setProductId((String) itemData.get("productId"));
                if (itemData.containsKey("productName")) item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("productCode")) item.setProductCode((String) itemData.get("productCode"));
                if (itemData.containsKey("colorId")) item.setColorId((String) itemData.get("colorId"));
                if (itemData.containsKey("colorName")) item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode")) item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("batchId")) item.setBatchId((String) itemData.get("batchId"));
                if (itemData.containsKey("batchCode")) item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("quantity")) item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit")) item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("price")) item.setPrice(new BigDecimal(itemData.get("price").toString()));
                if (itemData.containsKey("remark")) item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();
            
            SalesOrder created = salesService.createSales(order, items);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSales(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            SalesOrder order = new SalesOrder();
            if (request.containsKey("customerId")) order.setCustomerId((String) request.get("customerId"));
            if (request.containsKey("customerName")) order.setCustomerName((String) request.get("customerName"));
            if (request.containsKey("salesDate")) order.setSalesDate(LocalDate.parse((String) request.get("salesDate")));
            if (request.containsKey("expectedDate")) order.setExpectedDate(LocalDate.parse((String) request.get("expectedDate")));
            if (request.containsKey("receivedAmount")) order.setReceivedAmount(new BigDecimal(request.get("receivedAmount").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                order.setStatus(SalesOrder.OrderStatus.valueOf(statusStr));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            List<SalesOrderItem> items = itemsData.stream().map(itemData -> {
                SalesOrderItem item = new SalesOrderItem();
                if (itemData.containsKey("productId")) item.setProductId((String) itemData.get("productId"));
                if (itemData.containsKey("productName")) item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("productCode")) item.setProductCode((String) itemData.get("productCode"));
                if (itemData.containsKey("colorId")) item.setColorId((String) itemData.get("colorId"));
                if (itemData.containsKey("colorName")) item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode")) item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("batchId")) item.setBatchId((String) itemData.get("batchId"));
                if (itemData.containsKey("batchCode")) item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("quantity")) item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit")) item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("price")) item.setPrice(new BigDecimal(itemData.get("price").toString()));
                if (itemData.containsKey("remark")) item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();
            
            SalesOrder updated = salesService.updateSales(id, order, items);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSales(@PathVariable String id) {
        try {
            salesService.deleteSales(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/check-stock")
    public ResponseEntity<?> checkStock(@RequestBody Map<String, Object> request) {
        String batchId = (String) request.get("batchId");
        BigDecimal quantity = new BigDecimal(request.get("quantity").toString());
        
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("缸号不存在"));
        
        boolean available = batch.getStockQuantity().compareTo(quantity) >= 0;
        return ResponseEntity.ok(Map.of(
            "available", available,
            "stockQuantity", batch.getStockQuantity()
        ));
    }
}

