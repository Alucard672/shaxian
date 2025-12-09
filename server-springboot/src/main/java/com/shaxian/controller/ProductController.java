package com.shaxian.controller;

import com.shaxian.entity.Batch;
import com.shaxian.entity.Color;
import com.shaxian.entity.Product;
import com.shaxian.repository.BatchRepository;
import com.shaxian.repository.ColorRepository;
import com.shaxian.service.ProductService;
import com.shaxian.util.UuidUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final ColorRepository colorRepository;
    private final BatchRepository batchRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        try {
            Product created = productService.createProduct(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product product) {
        try {
            Product updated = productService.updateProduct(id, product);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== 色号管理 ==========
    @GetMapping("/{id}/colors")
    public ResponseEntity<List<Color>> getColors(@PathVariable String id) {
        List<Color> colors = colorRepository.findByProductIdOrderByCode(id);
        // 确保返回的对象不包含懒加载的 product
        colors.forEach(color -> color.setProduct(null));
        return ResponseEntity.ok(colors);
    }

    @PostMapping("/{id}/colors")
    public ResponseEntity<Color> createColor(@PathVariable String id, @RequestBody Color color) {
        color.setId(UuidUtil.generate());
        color.setProductId(id);
        Color saved = colorRepository.save(color);
        // 确保返回的对象不包含懒加载的 product
        saved.setProduct(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/colors/{id}")
    public ResponseEntity<Color> updateColor(@PathVariable String id, @RequestBody Color color) {
        if (!colorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Color existing = colorRepository.findById(id).orElseThrow();
        color.setId(id);
        color.setProductId(existing.getProductId());
        color.setCreatedAt(existing.getCreatedAt());
        Color saved = colorRepository.save(color);
        // 确保返回的对象不包含懒加载的 product
        saved.setProduct(null);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/colors/{id}")
    public ResponseEntity<Void> deleteColor(@PathVariable String id) {
        if (!colorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        colorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ========== 缸号管理 ==========
    @GetMapping("/colors/{colorId}/batches")
    public ResponseEntity<List<Batch>> getBatches(@PathVariable String colorId) {
        List<Batch> batches = batchRepository.findByColorIdOrderByCode(colorId);
        // 确保返回的对象不包含懒加载的 color
        batches.forEach(batch -> batch.setColor(null));
        return ResponseEntity.ok(batches);
    }

    @PostMapping("/colors/{colorId}/batches")
    public ResponseEntity<Batch> createBatch(@PathVariable String colorId, @RequestBody Batch batch) {
        batch.setId(UuidUtil.generate());
        batch.setColorId(colorId);
        if (batch.getStockQuantity() == null) {
            batch.setStockQuantity(batch.getInitialQuantity() != null ? batch.getInitialQuantity() : java.math.BigDecimal.ZERO);
        }
        Batch saved = batchRepository.save(batch);
        // 确保返回的对象不包含懒加载的 color
        saved.setColor(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/batches/{id}")
    public ResponseEntity<Batch> updateBatch(@PathVariable String id, @RequestBody Batch batch) {
        if (!batchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Batch existing = batchRepository.findById(id).orElseThrow();
        batch.setId(id);
        batch.setColorId(existing.getColorId());
        batch.setCreatedAt(existing.getCreatedAt());
        Batch saved = batchRepository.save(batch);
        // 确保返回的对象不包含懒加载的 color
        saved.setColor(null);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable String id) {
        if (!batchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        batchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

