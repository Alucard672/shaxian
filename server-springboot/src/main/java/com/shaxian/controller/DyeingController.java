package com.shaxian.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shaxian.entity.DyeingOrder;
import com.shaxian.entity.DyeingOrderItem;
import com.shaxian.repository.DyeingOrderItemRepository;
import com.shaxian.repository.DyeingOrderRepository;
import com.shaxian.util.OrderNumberGenerator;
import com.shaxian.util.UuidUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dyeing")
public class DyeingController {
    private final DyeingOrderRepository dyeingOrderRepository;
    private final DyeingOrderItemRepository dyeingOrderItemRepository;
    private final ObjectMapper objectMapper;

    public DyeingController(
            DyeingOrderRepository dyeingOrderRepository,
            DyeingOrderItemRepository dyeingOrderItemRepository,
            ObjectMapper objectMapper) {
        this.dyeingOrderRepository = dyeingOrderRepository;
        this.dyeingOrderItemRepository = dyeingOrderItemRepository;
        this.objectMapper = objectMapper;
    }


    @GetMapping
    public ResponseEntity<List<DyeingOrder>> getAllDyeingOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productId) {
        List<DyeingOrder> orders = dyeingOrderRepository.findByFilters(status, productId);
        orders.forEach(order -> order.setItems(dyeingOrderItemRepository.findByOrderId(order.getId())));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DyeingOrder> getDyeingOrder(@PathVariable String id) {
        Optional<DyeingOrder> order = dyeingOrderRepository.findById(id);
        if (order.isPresent()) {
            order.get().setItems(dyeingOrderItemRepository.findByOrderId(id));
            return ResponseEntity.ok(order.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createDyeingOrder(@RequestBody Map<String, Object> request) {
        try {
            DyeingOrder order = new DyeingOrder();
            order.setId(UuidUtil.generate());
            order.setOrderNumber(OrderNumberGenerator.generateDyeingOrderNumber());
            
            if (request.containsKey("productId")) order.setProductId((String) request.get("productId"));
            if (request.containsKey("productName")) order.setProductName((String) request.get("productName"));
            if (request.containsKey("greyBatchId")) order.setGreyBatchId((String) request.get("greyBatchId"));
            if (request.containsKey("greyBatchCode")) order.setGreyBatchCode((String) request.get("greyBatchCode"));
            if (request.containsKey("factoryId")) order.setFactoryId((String) request.get("factoryId"));
            if (request.containsKey("factoryName")) order.setFactoryName((String) request.get("factoryName"));
            if (request.containsKey("factoryPhone")) order.setFactoryPhone((String) request.get("factoryPhone"));
            if (request.containsKey("shipmentDate")) order.setShipmentDate(LocalDate.parse((String) request.get("shipmentDate")));
            if (request.containsKey("expectedCompletionDate")) order.setExpectedCompletionDate(LocalDate.parse((String) request.get("expectedCompletionDate")));
            if (request.containsKey("processingPrice")) order.setProcessingPrice(new BigDecimal(request.get("processingPrice").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("operator")) order.setOperator((String) request.get("operator"));
            if (request.containsKey("status")) {
                order.setStatus(DyeingOrder.OrderStatus.valueOf((String) request.get("status")));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            BigDecimal totalQuantity = itemsData.stream()
                    .map(item -> new BigDecimal(item.get("quantity").toString()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(totalQuantity.multiply(order.getProcessingPrice()));
            
            DyeingOrder saved = dyeingOrderRepository.save(order);
            
            List<DyeingOrderItem> items = itemsData.stream().map(itemData -> {
                DyeingOrderItem item = new DyeingOrderItem();
                item.setId(UuidUtil.generate());
                item.setOrderId(saved.getId());
                if (itemData.containsKey("targetColorId")) item.setTargetColorId((String) itemData.get("targetColorId"));
                if (itemData.containsKey("targetColorCode")) item.setTargetColorCode((String) itemData.get("targetColorCode"));
                if (itemData.containsKey("targetColorName")) item.setTargetColorName((String) itemData.get("targetColorName"));
                if (itemData.containsKey("targetColorValue")) item.setTargetColorValue((String) itemData.get("targetColorValue"));
                if (itemData.containsKey("quantity")) item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                return item;
            }).toList();
            
            dyeingOrderItemRepository.saveAll(items);
            saved.setItems(items);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDyeingOrder(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            DyeingOrder order = dyeingOrderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("染色加工单不存在"));
            
            if (request.containsKey("productId")) order.setProductId((String) request.get("productId"));
            if (request.containsKey("productName")) order.setProductName((String) request.get("productName"));
            if (request.containsKey("greyBatchId")) order.setGreyBatchId((String) request.get("greyBatchId"));
            if (request.containsKey("greyBatchCode")) order.setGreyBatchCode((String) request.get("greyBatchCode"));
            if (request.containsKey("factoryId")) order.setFactoryId((String) request.get("factoryId"));
            if (request.containsKey("factoryName")) order.setFactoryName((String) request.get("factoryName"));
            if (request.containsKey("factoryPhone")) order.setFactoryPhone((String) request.get("factoryPhone"));
            if (request.containsKey("shipmentDate")) order.setShipmentDate(LocalDate.parse((String) request.get("shipmentDate")));
            if (request.containsKey("expectedCompletionDate")) order.setExpectedCompletionDate(LocalDate.parse((String) request.get("expectedCompletionDate")));
            if (request.containsKey("actualCompletionDate")) order.setActualCompletionDate(LocalDate.parse((String) request.get("actualCompletionDate")));
            if (request.containsKey("processingPrice")) order.setProcessingPrice(new BigDecimal(request.get("processingPrice").toString()));
            if (request.containsKey("remark")) order.setRemark((String) request.get("remark"));
            if (request.containsKey("status")) {
                order.setStatus(DyeingOrder.OrderStatus.valueOf((String) request.get("status")));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) request.get("items");
            BigDecimal totalQuantity = itemsData.stream()
                    .map(item -> new BigDecimal(item.get("quantity").toString()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(totalQuantity.multiply(order.getProcessingPrice()));
            
            dyeingOrderItemRepository.deleteByOrderId(id);
            
            List<DyeingOrderItem> items = itemsData.stream().map(itemData -> {
                DyeingOrderItem item = new DyeingOrderItem();
                item.setId(UuidUtil.generate());
                item.setOrderId(id);
                if (itemData.containsKey("targetColorId")) item.setTargetColorId((String) itemData.get("targetColorId"));
                if (itemData.containsKey("targetColorCode")) item.setTargetColorCode((String) itemData.get("targetColorCode"));
                if (itemData.containsKey("targetColorName")) item.setTargetColorName((String) itemData.get("targetColorName"));
                if (itemData.containsKey("targetColorValue")) item.setTargetColorValue((String) itemData.get("targetColorValue"));
                if (itemData.containsKey("quantity")) item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
                return item;
            }).toList();
            
            dyeingOrderItemRepository.saveAll(items);
            DyeingOrder saved = dyeingOrderRepository.save(order);
            saved.setItems(items);
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDyeingOrder(@PathVariable String id) {
        if (!dyeingOrderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dyeingOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

