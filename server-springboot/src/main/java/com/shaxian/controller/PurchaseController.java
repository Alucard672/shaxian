package com.shaxian.controller;

import com.shaxian.entity.PurchaseOrder;
import com.shaxian.entity.PurchaseOrderItem;
import com.shaxian.service.PurchaseService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {
    private final PurchaseService purchaseService;

    public PurchaseController(
            PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }


    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchases(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PurchaseOrder> orders = purchaseService.getAllPurchases(status, supplierId != null ? Long.parseLong(supplierId) : null, startDate, endDate);
        // 加载明细
        orders.forEach(order -> {
            List<PurchaseOrderItem> items = purchaseService.getPurchaseById(order.getId())
                    .map(PurchaseOrder::getItems)
                    .orElse(List.of());
            order.setItems(items);
        });
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchase(@PathVariable Long id) {
        return purchaseService.getPurchaseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPurchase(@RequestBody Map<String, Object> request) {
        try {
            PurchaseOrder order = new PurchaseOrder();
            // 从 request 中提取订单信息并设置到 order 对象
            if (request.containsKey("supplierId")) order.setSupplierId(parseLong(request.get("supplierId")));
            if (request.containsKey("supplierName")) order.setSupplierName((String) request.get("supplierName"));
            if (request.containsKey("purchaseDate")) order.setPurchaseDate(LocalDate.parse((String) request.get("purchaseDate")));
            if (request.containsKey("expectedDate")) order.setExpectedDate(LocalDate.parse((String) request.get("expectedDate")));
            if (request.containsKey("paidAmount")) order.setPaidAmount(new java.math.BigDecimal(request.get("paidAmount").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("operator")) order.setOperator((String) request.get("operator"));
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                order.setStatus(PurchaseOrder.OrderStatus.valueOf(statusStr));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            List<PurchaseOrderItem> items = itemsData.stream().map(itemData -> {
                PurchaseOrderItem item = new PurchaseOrderItem();
                if (itemData.containsKey("productId")) item.setProductId(parseLong(itemData.get("productId")));
                if (itemData.containsKey("productName")) item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("productCode")) item.setProductCode((String) itemData.get("productCode"));
                if (itemData.containsKey("colorId")) item.setColorId(parseLong(itemData.get("colorId")));
                if (itemData.containsKey("colorName")) item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode")) item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("batchCode")) item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("quantity")) item.setQuantity(new java.math.BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit")) item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("price")) item.setPrice(new java.math.BigDecimal(itemData.get("price").toString()));
                if (itemData.containsKey("productionDate")) item.setProductionDate(LocalDate.parse((String) itemData.get("productionDate")));
                if (itemData.containsKey("stockLocation")) item.setStockLocation((String) itemData.get("stockLocation"));
                if (itemData.containsKey("remark")) item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();
            
            PurchaseOrder created = purchaseService.createPurchase(order, items);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            PurchaseOrder order = new PurchaseOrder();
            if (request.containsKey("supplierId")) order.setSupplierId(parseLong(request.get("supplierId")));
            if (request.containsKey("supplierName")) order.setSupplierName((String) request.get("supplierName"));
            if (request.containsKey("purchaseDate")) order.setPurchaseDate(LocalDate.parse((String) request.get("purchaseDate")));
            if (request.containsKey("expectedDate")) order.setExpectedDate(LocalDate.parse((String) request.get("expectedDate")));
            if (request.containsKey("paidAmount")) order.setPaidAmount(new java.math.BigDecimal(request.get("paidAmount").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                order.setStatus(PurchaseOrder.OrderStatus.valueOf(statusStr));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            List<PurchaseOrderItem> items = itemsData.stream().map(itemData -> {
                PurchaseOrderItem item = new PurchaseOrderItem();
                if (itemData.containsKey("productId")) item.setProductId(parseLong(itemData.get("productId")));
                if (itemData.containsKey("productName")) item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("productCode")) item.setProductCode((String) itemData.get("productCode"));
                if (itemData.containsKey("colorId")) item.setColorId(parseLong(itemData.get("colorId")));
                if (itemData.containsKey("colorName")) item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode")) item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("batchCode")) item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("quantity")) item.setQuantity(new java.math.BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit")) item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("price")) item.setPrice(new java.math.BigDecimal(itemData.get("price").toString()));
                if (itemData.containsKey("productionDate")) item.setProductionDate(LocalDate.parse((String) itemData.get("productionDate")));
                if (itemData.containsKey("stockLocation")) item.setStockLocation((String) itemData.get("stockLocation"));
                if (itemData.containsKey("remark")) item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();
            
            PurchaseOrder updated = purchaseService.updatePurchase(id, order, items);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchase(@PathVariable Long id) {
        try {
            purchaseService.deletePurchase(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private Long parseLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}

