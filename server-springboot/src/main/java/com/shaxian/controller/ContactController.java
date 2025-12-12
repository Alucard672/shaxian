package com.shaxian.controller;

import com.shaxian.entity.Customer;
import com.shaxian.entity.Supplier;
import com.shaxian.repository.CustomerRepository;
import com.shaxian.repository.SupplierRepository;
import com.shaxian.util.UuidUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;

    public ContactController(
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository) {
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
    }


    // ========== 客户管理 ==========
    @GetMapping("/customers")
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<Customer> getCustomer(@PathVariable String id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/customers")
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        if (customerRepository.existsByCode(customer.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        customer.setId(UuidUtil.generate());
        return ResponseEntity.status(HttpStatus.CREATED).body(customerRepository.save(customer));
    }

    @PutMapping("/customers/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable String id, @RequestBody Customer customer) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Customer existing = customerRepository.findById(id).orElseThrow();
        if (!existing.getCode().equals(customer.getCode()) && 
            customerRepository.existsByCode(customer.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        customer.setId(id);
        customer.setCreatedAt(existing.getCreatedAt());
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ========== 供应商管理 ==========
    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @GetMapping("/suppliers/{id}")
    public ResponseEntity<Supplier> getSupplier(@PathVariable String id) {
        return supplierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        if (supplierRepository.existsByCode(supplier.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        supplier.setId(UuidUtil.generate());
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable String id, @RequestBody Supplier supplier) {
        if (!supplierRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Supplier existing = supplierRepository.findById(id).orElseThrow();
        if (!existing.getCode().equals(supplier.getCode()) && 
            supplierRepository.existsByCode(supplier.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        supplier.setId(id);
        supplier.setCreatedAt(existing.getCreatedAt());
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable String id) {
        if (!supplierRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        supplierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

