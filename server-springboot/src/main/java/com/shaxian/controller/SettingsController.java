package com.shaxian.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shaxian.entity.*;
import com.shaxian.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final StoreInfoRepository storeInfoRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final CustomQueryRepository customQueryRepository;
    private final InventoryAlertSettingsRepository inventoryAlertSettingsRepository;
    private final SystemParamsRepository systemParamsRepository;
    private final ObjectMapper objectMapper;

    public SettingsController(
            StoreInfoRepository storeInfoRepository,
            EmployeeRepository employeeRepository,
            RoleRepository roleRepository,
            CustomQueryRepository customQueryRepository,
            InventoryAlertSettingsRepository inventoryAlertSettingsRepository,
            SystemParamsRepository systemParamsRepository,
            ObjectMapper objectMapper) {
        this.storeInfoRepository = storeInfoRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.customQueryRepository = customQueryRepository;
        this.inventoryAlertSettingsRepository = inventoryAlertSettingsRepository;
        this.systemParamsRepository = systemParamsRepository;
        this.objectMapper = objectMapper;
    }


    // ========== 门店信息 ==========
    @GetMapping("/store")
    public ResponseEntity<StoreInfo> getStoreInfo() {
        Optional<StoreInfo> storeInfo = storeInfoRepository.findFirstByOrderByIdAsc();
        if (storeInfo.isEmpty()) {
            StoreInfo newStore = new StoreInfo();
            newStore.setName("");
            return ResponseEntity.ok(storeInfoRepository.save(newStore));
        }
        return ResponseEntity.ok(storeInfo.get());
    }

    @PutMapping("/store")
    public ResponseEntity<StoreInfo> updateStoreInfo(@RequestBody Map<String, Object> request) {
        Optional<StoreInfo> existing = storeInfoRepository.findFirstByOrderByIdAsc();
        StoreInfo storeInfo;
        
        if (existing.isPresent()) {
            storeInfo = existing.get();
        } else {
            storeInfo = new StoreInfo();
        }
        
        if (request.containsKey("name")) storeInfo.setName((String) request.get("name"));
        if (request.containsKey("code")) storeInfo.setCode((String) request.get("code"));
        if (request.containsKey("address")) storeInfo.setAddress((String) request.get("address"));
        if (request.containsKey("phone")) storeInfo.setPhone((String) request.get("phone"));
        if (request.containsKey("email")) storeInfo.setEmail((String) request.get("email"));
        if (request.containsKey("fax")) storeInfo.setFax((String) request.get("fax"));
        if (request.containsKey("postalCode")) storeInfo.setPostalCode((String) request.get("postalCode"));
        if (request.containsKey("remark")) storeInfo.setRemark((String) request.get("remark"));
        
        return ResponseEntity.ok(storeInfoRepository.save(storeInfo));
    }

    // ========== 员工管理 ==========
    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeRepository.findAll());
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long id) {
        return employeeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeRepository.save(employee));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Employee existing = employeeRepository.findById(id).orElseThrow();
        employee.setId(id);
        employee.setCreatedAt(existing.getCreatedAt());
        return ResponseEntity.ok(employeeRepository.save(employee));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        employeeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ========== 角色管理 ==========
    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody Map<String, Object> request) throws JsonProcessingException {
        Role role = new Role();
        role.setName((String) request.get("name"));
        if (request.containsKey("description")) role.setDescription((String) request.get("description"));
        if (request.containsKey("permissions")) {
            role.setPermissions(objectMapper.writeValueAsString(request.get("permissions")));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(roleRepository.save(role));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> request) throws JsonProcessingException {
        if (!roleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Role existing = roleRepository.findById(id).orElseThrow();
        Role role = new Role();
        role.setId(id);
        role.setName((String) request.get("name"));
        if (request.containsKey("description")) role.setDescription((String) request.get("description"));
        if (request.containsKey("permissions")) {
            role.setPermissions(objectMapper.writeValueAsString(request.get("permissions")));
        }
        role.setCreatedAt(existing.getCreatedAt());
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        if (!roleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ========== 自定义查询 ==========
    @GetMapping("/queries")
    public ResponseEntity<List<CustomQuery>> getQueries(@RequestParam(required = false) String module) {
        if (module != null) {
            return ResponseEntity.ok(customQueryRepository.findByModule(module));
        }
        return ResponseEntity.ok(customQueryRepository.findAll());
    }

    @PostMapping("/queries")
    public ResponseEntity<CustomQuery> createQuery(@RequestBody Map<String, Object> request) throws JsonProcessingException {
        CustomQuery query = new CustomQuery();
        query.setName((String) request.get("name"));
        query.setModule((String) request.get("module"));
        if (request.containsKey("conditions")) {
            query.setConditions(objectMapper.writeValueAsString(request.get("conditions")));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(customQueryRepository.save(query));
    }

    // ========== 库存预警设置 ==========
    @GetMapping("/inventory-alert")
    public ResponseEntity<InventoryAlertSettings> getInventoryAlertSettings() {
        Optional<InventoryAlertSettings> settings = inventoryAlertSettingsRepository.findFirstByOrderByIdAsc();
        if (settings.isEmpty()) {
            InventoryAlertSettings newSettings = new InventoryAlertSettings();
            return ResponseEntity.ok(inventoryAlertSettingsRepository.save(newSettings));
        }
        return ResponseEntity.ok(settings.get());
    }

    @PutMapping("/inventory-alert")
    public ResponseEntity<InventoryAlertSettings> updateInventoryAlertSettings(@RequestBody Map<String, Object> request) {
        Optional<InventoryAlertSettings> existing = inventoryAlertSettingsRepository.findFirstByOrderByIdAsc();
        InventoryAlertSettings settings;
        
        if (existing.isPresent()) {
            settings = existing.get();
        } else {
            settings = new InventoryAlertSettings();
        }
        
        if (request.containsKey("enabled")) settings.setEnabled((Boolean) request.get("enabled"));
        if (request.containsKey("threshold")) settings.setThreshold(new BigDecimal(request.get("threshold").toString()));
        if (request.containsKey("autoAlert")) settings.setAutoAlert((Boolean) request.get("autoAlert"));
        
        return ResponseEntity.ok(inventoryAlertSettingsRepository.save(settings));
    }

    // ========== 系统参数 ==========
    @GetMapping("/params")
    public ResponseEntity<SystemParams> getSystemParams() {
        Optional<SystemParams> params = systemParamsRepository.findFirstByOrderByIdAsc();
        if (params.isEmpty()) {
            SystemParams newParams = new SystemParams();
            return ResponseEntity.ok(systemParamsRepository.save(newParams));
        }
        return ResponseEntity.ok(params.get());
    }

    @PutMapping("/params")
    public ResponseEntity<SystemParams> updateSystemParams(@RequestBody Map<String, Object> request) {
        Optional<SystemParams> existing = systemParamsRepository.findFirstByOrderByIdAsc();
        SystemParams params;
        
        if (existing.isPresent()) {
            params = existing.get();
        } else {
            params = new SystemParams();
        }
        
        if (request.containsKey("enableDyeingProcess")) {
            params.setEnableDyeingProcess((Boolean) request.get("enableDyeingProcess"));
        }
        
        return ResponseEntity.ok(systemParamsRepository.save(params));
    }
}

