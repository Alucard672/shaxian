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
public class ProductController {
    private final ProductService productService;
    private final ColorRepository colorRepository;
    private final BatchRepository batchRepository;

    public ProductController(ProductService productService, ColorRepository colorRepository, BatchRepository batchRepository) {
        this.productService = productService;
        this.colorRepository = colorRepository;
        this.batchRepository = batchRepository;
    }

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
        return ResponseEntity.ok(colorRepository.findByProductIdOrderByCode(id));
    }

    @PostMapping("/{id}/colors")
    public ResponseEntity<Color> createColor(@PathVariable String id, @RequestBody Color color) {
        color.setId(UuidUtil.generate());
        color.setProductId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(colorRepository.save(color));
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
        return ResponseEntity.ok(colorRepository.save(color));
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
        return ResponseEntity.ok(batchRepository.findByColorIdOrderByCode(colorId));
    }

    @PostMapping("/colors/{colorId}/batches")
    public ResponseEntity<Batch> createBatch(@PathVariable String colorId, @RequestBody Batch batch) {
        batch.setId(UuidUtil.generate());
        batch.setColorId(colorId);
        if (batch.getStockQuantity() == null) {
            batch.setStockQuantity(batch.getInitialQuantity() != null ? batch.getInitialQuantity() : java.math.BigDecimal.ZERO);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(batchRepository.save(batch));
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
        return ResponseEntity.ok(batchRepository.save(batch));
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

