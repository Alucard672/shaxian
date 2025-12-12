package com.shaxian.controller;

import com.shaxian.entity.*;
import com.shaxian.repository.*;
import com.shaxian.util.OrderNumberGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final AdjustmentOrderRepository adjustmentOrderRepository;
    private final AdjustmentOrderItemRepository adjustmentOrderItemRepository;
    private final InventoryCheckOrderRepository inventoryCheckOrderRepository;
    private final InventoryCheckItemRepository inventoryCheckItemRepository;
    private final BatchRepository batchRepository;

    public InventoryController(
            AdjustmentOrderRepository adjustmentOrderRepository,
            AdjustmentOrderItemRepository adjustmentOrderItemRepository,
            InventoryCheckOrderRepository inventoryCheckOrderRepository,
            InventoryCheckItemRepository inventoryCheckItemRepository,
            BatchRepository batchRepository) {
        this.adjustmentOrderRepository = adjustmentOrderRepository;
        this.adjustmentOrderItemRepository = adjustmentOrderItemRepository;
        this.inventoryCheckOrderRepository = inventoryCheckOrderRepository;
        this.inventoryCheckItemRepository = inventoryCheckItemRepository;
        this.batchRepository = batchRepository;
    }

    // ========== 库存调整单 ==========
    @GetMapping("/adjustments")
    public ResponseEntity<List<AdjustmentOrder>> getAdjustments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        List<AdjustmentOrder> orders = adjustmentOrderRepository.findByFilters(status, type);
        orders.forEach(order -> order.setItems(adjustmentOrderItemRepository.findByOrderId(order.getId())));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/adjustments/{id}")
    public ResponseEntity<AdjustmentOrder> getAdjustment(@PathVariable Long id) {
        Optional<AdjustmentOrder> order = adjustmentOrderRepository.findById(id);
        if (order.isPresent()) {
            order.get().setItems(adjustmentOrderItemRepository.findByOrderId(id));
            return ResponseEntity.ok(order.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/adjustments")
    @Transactional
    public ResponseEntity<?> createAdjustment(@RequestBody Map<String, Object> request) {
        try {
            AdjustmentOrder order = new AdjustmentOrder();
            order.setOrderNumber(OrderNumberGenerator.generateAdjustmentOrderNumber());
            if (request.containsKey("type")) {
                order.setType(AdjustmentOrder.AdjustmentType.valueOf((String) request.get("type")));
            }
            order.setAdjustmentDate(LocalDate.parse((String) request.get("adjustmentDate")));
            order.setOperator((String) request.get("operator"));
            if (request.containsKey("remark"))
                order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                order.setStatus(AdjustmentOrder.OrderStatus.valueOf((String) request.get("status")));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            BigDecimal totalQuantity = itemsData.stream()
                    .map(item -> new BigDecimal(item.get("quantity").toString()).abs())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalQuantity(totalQuantity);

            AdjustmentOrder saved = adjustmentOrderRepository.save(order);

            List<AdjustmentOrderItem> items = itemsData.stream().map(itemData -> {
                AdjustmentOrderItem item = new AdjustmentOrderItem();
                item.setOrderId(saved.getId());
                if (itemData.containsKey("batchId"))
                    item.setBatchId((Long) itemData.get("batchId"));
                if (itemData.containsKey("batchCode"))
                    item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("productId"))
                    item.setProductId((Long) itemData.get("productId"));
                if (itemData.containsKey("productName"))
                    item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("colorId"))
                    item.setColorId((Long) itemData.get("colorId"));
                if (itemData.containsKey("colorName"))
                    item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode"))
                    item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("quantity"))
                    item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit"))
                    item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("remark"))
                    item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();

            adjustmentOrderItemRepository.saveAll(items);

            if (order.getStatus() == AdjustmentOrder.OrderStatus.已完成) {
                for (AdjustmentOrderItem item : items) {
                    batchRepository.increaseStock(item.getBatchId(), item.getQuantity());
                }
            }

            saved.setItems(items);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/adjustments/{id}")
    @Transactional
    public ResponseEntity<?> updateAdjustment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            AdjustmentOrder order = adjustmentOrderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("库存调整单不存在"));

            AdjustmentOrder.OrderStatus oldStatus = order.getStatus();

            if (request.containsKey("type")) {
                order.setType(AdjustmentOrder.AdjustmentType.valueOf((String) request.get("type")));
            }
            if (request.containsKey("adjustmentDate")) {
                order.setAdjustmentDate(LocalDate.parse((String) request.get("adjustmentDate")));
            }
            if (request.containsKey("remark"))
                order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                order.setStatus(AdjustmentOrder.OrderStatus.valueOf((String) request.get("status")));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            BigDecimal totalQuantity = itemsData.stream()
                    .map(item -> new BigDecimal(item.get("quantity").toString()).abs())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalQuantity(totalQuantity);

            if (oldStatus == AdjustmentOrder.OrderStatus.已完成 && order.getStatus() == AdjustmentOrder.OrderStatus.草稿) {
                List<AdjustmentOrderItem> oldItems = adjustmentOrderItemRepository.findByOrderId(id);
                for (AdjustmentOrderItem item : oldItems) {
                    batchRepository.decreaseStock(item.getBatchId(), item.getQuantity());
                }
            }

            adjustmentOrderItemRepository.deleteByOrderId(id);

            List<AdjustmentOrderItem> items = itemsData.stream().map(itemData -> {
                AdjustmentOrderItem item = new AdjustmentOrderItem();
                item.setOrderId(id);
                if (itemData.containsKey("batchId"))
                    item.setBatchId(parseLong(itemData.get("batchId")));
                if (itemData.containsKey("batchCode"))
                    item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("productId"))
                    item.setProductId(parseLong(itemData.get("productId")));
                if (itemData.containsKey("productName"))
                    item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("colorId"))
                    item.setColorId(parseLong(itemData.get("colorId")));
                if (itemData.containsKey("colorName"))
                    item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode"))
                    item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("quantity"))
                    item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                if (itemData.containsKey("unit"))
                    item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("remark"))
                    item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();

            adjustmentOrderItemRepository.saveAll(items);

            if (order.getStatus() == AdjustmentOrder.OrderStatus.已完成) {
                for (AdjustmentOrderItem item : items) {
                    batchRepository.increaseStock(item.getBatchId(), item.getQuantity());
                }
            }

            AdjustmentOrder saved = adjustmentOrderRepository.save(order);
            saved.setItems(items);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 盘点单 ==========
    @GetMapping("/checks")
    public ResponseEntity<List<InventoryCheckOrder>> getChecks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String warehouse) {
        List<InventoryCheckOrder> orders = inventoryCheckOrderRepository.findByFilters(status, warehouse);
        orders.forEach(order -> order.setItems(inventoryCheckItemRepository.findByOrderId(order.getId())));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/checks/{id}")
    public ResponseEntity<InventoryCheckOrder> getCheck(@PathVariable Long id) {
        Optional<InventoryCheckOrder> order = inventoryCheckOrderRepository.findById(id);
        if (order.isPresent()) {
            order.get().setItems(inventoryCheckItemRepository.findByOrderId(id));
            return ResponseEntity.ok(order.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/checks")
    @Transactional
    public ResponseEntity<?> createCheck(@RequestBody Map<String, Object> request) {
        try {
            InventoryCheckOrder order = new InventoryCheckOrder();
            order.setOrderNumber(OrderNumberGenerator.generateInventoryCheckOrderNumber());
            order.setName((String) request.get("name"));
            order.setWarehouse((String) request.get("warehouse"));
            order.setPlanDate(LocalDate.parse((String) request.get("planDate")));
            order.setOperator((String) request.get("operator"));
            if (request.containsKey("remark"))
                order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                order.setStatus(InventoryCheckOrder.OrderStatus.valueOf((String) request.get("status")));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            int progressTotal = itemsData.size();
            int progressCompleted = (int) itemsData.stream()
                    .filter(item -> item.containsKey("actualQuantity") && item.get("actualQuantity") != null)
                    .count();

            BigDecimal surplus = BigDecimal.ZERO;
            BigDecimal deficit = BigDecimal.ZERO;
            for (Map<String, Object> itemData : itemsData) {
                if (itemData.containsKey("actualQuantity") && itemData.get("actualQuantity") != null) {
                    BigDecimal systemQty = new BigDecimal(itemData.get("systemQuantity").toString());
                    BigDecimal actualQty = new BigDecimal(itemData.get("actualQuantity").toString());
                    BigDecimal diff = actualQty.subtract(systemQty);
                    if (diff.compareTo(BigDecimal.ZERO) > 0) {
                        surplus = surplus.add(diff);
                    } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                        deficit = deficit.add(diff.abs());
                    }
                }
            }

            order.setProgressTotal(progressTotal);
            order.setProgressCompleted(progressCompleted);
            order.setSurplus(surplus);
            order.setDeficit(deficit);

            InventoryCheckOrder saved = inventoryCheckOrderRepository.save(order);

            List<InventoryCheckItem> items = itemsData.stream().map(itemData -> {
                InventoryCheckItem item = new InventoryCheckItem();
                item.setOrderId(saved.getId());
                if (itemData.containsKey("batchId"))
                    item.setBatchId(parseLong(itemData.get("batchId")));
                if (itemData.containsKey("batchCode"))
                    item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("productId"))
                    item.setProductId(parseLong(itemData.get("productId")));
                if (itemData.containsKey("productName"))
                    item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("colorId"))
                    item.setColorId(parseLong(itemData.get("colorId")));
                if (itemData.containsKey("colorName"))
                    item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode"))
                    item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("systemQuantity"))
                    item.setSystemQuantity(new BigDecimal(itemData.get("systemQuantity").toString()));
                if (itemData.containsKey("actualQuantity") && itemData.get("actualQuantity") != null) {
                    item.setActualQuantity(new BigDecimal(itemData.get("actualQuantity").toString()));
                    item.setDifference(item.getActualQuantity().subtract(item.getSystemQuantity()));
                }
                if (itemData.containsKey("unit"))
                    item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("remark"))
                    item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();

            inventoryCheckItemRepository.saveAll(items);
            saved.setItems(items);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/checks/{id}")
    @Transactional
    public ResponseEntity<?> updateCheck(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            InventoryCheckOrder order = inventoryCheckOrderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("盘点单不存在"));

            if (request.containsKey("name"))
                order.setName((String) request.get("name"));
            if (request.containsKey("warehouse"))
                order.setWarehouse((String) request.get("warehouse"));
            if (request.containsKey("planDate"))
                order.setPlanDate(LocalDate.parse((String) request.get("planDate")));
            if (request.containsKey("remark"))
                order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                order.setStatus(InventoryCheckOrder.OrderStatus.valueOf((String) request.get("status")));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            int progressTotal = itemsData.size();
            int progressCompleted = (int) itemsData.stream()
                    .filter(item -> item.containsKey("actualQuantity") && item.get("actualQuantity") != null)
                    .count();

            BigDecimal surplus = BigDecimal.ZERO;
            BigDecimal deficit = BigDecimal.ZERO;
            for (Map<String, Object> itemData : itemsData) {
                if (itemData.containsKey("actualQuantity") && itemData.get("actualQuantity") != null) {
                    BigDecimal systemQty = new BigDecimal(itemData.get("systemQuantity").toString());
                    BigDecimal actualQty = new BigDecimal(itemData.get("actualQuantity").toString());
                    BigDecimal diff = actualQty.subtract(systemQty);
                    if (diff.compareTo(BigDecimal.ZERO) > 0) {
                        surplus = surplus.add(diff);
                    } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                        deficit = deficit.add(diff.abs());
                    }
                }
            }

            order.setProgressTotal(progressTotal);
            order.setProgressCompleted(progressCompleted);
            order.setSurplus(surplus);
            order.setDeficit(deficit);

            inventoryCheckItemRepository.deleteByOrderId(id);

            List<InventoryCheckItem> items = itemsData.stream().map(itemData -> {
                InventoryCheckItem item = new InventoryCheckItem();
                item.setOrderId(id);
                if (itemData.containsKey("batchId"))
                    item.setBatchId(parseLong(itemData.get("batchId")));
                if (itemData.containsKey("batchCode"))
                    item.setBatchCode((String) itemData.get("batchCode"));
                if (itemData.containsKey("productId"))
                    item.setProductId(parseLong(itemData.get("productId")));
                if (itemData.containsKey("productName"))
                    item.setProductName((String) itemData.get("productName"));
                if (itemData.containsKey("colorId"))
                    item.setColorId(parseLong(itemData.get("colorId")));
                if (itemData.containsKey("colorName"))
                    item.setColorName((String) itemData.get("colorName"));
                if (itemData.containsKey("colorCode"))
                    item.setColorCode((String) itemData.get("colorCode"));
                if (itemData.containsKey("systemQuantity"))
                    item.setSystemQuantity(new BigDecimal(itemData.get("systemQuantity").toString()));
                if (itemData.containsKey("actualQuantity") && itemData.get("actualQuantity") != null) {
                    item.setActualQuantity(new BigDecimal(itemData.get("actualQuantity").toString()));
                    item.setDifference(item.getActualQuantity().subtract(item.getSystemQuantity()));
                }
                if (itemData.containsKey("unit"))
                    item.setUnit((String) itemData.get("unit"));
                if (itemData.containsKey("remark"))
                    item.setRemark((String) itemData.get("remark"));
                return item;
            }).toList();

            inventoryCheckItemRepository.saveAll(items);
            InventoryCheckOrder saved = inventoryCheckOrderRepository.save(order);
            saved.setItems(items);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/checks/{id}")
    public ResponseEntity<Void> deleteCheck(@PathVariable Long id) {
        if (!inventoryCheckOrderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventoryCheckOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
