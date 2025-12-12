package com.shaxian.controller;

import com.shaxian.entity.Employee;
import com.shaxian.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final EmployeeRepository employeeRepository;

    public AuthController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String phone = loginRequest.get("phone");
        String password = loginRequest.get("password");

        if (phone == null || password == null || phone.trim().isEmpty() || password.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "手机号和密码不能为空");
            return ResponseEntity.badRequest().body(error);
        }

        Optional<Employee> employeeOpt = employeeRepository.findByPhone(phone);
        
        if (employeeOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "用户不存在");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        Employee employee = employeeOpt.get();

        // 检查密码（默认密码123456）
        if (employee.getPassword() == null || employee.getPassword().isEmpty()) {
            // 如果没有设置密码，默认密码是123456
            if (!"123456".equals(password)) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "密码错误");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        } else {
            // 如果设置了密码，验证密码
            if (!employee.getPassword().equals(password)) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "密码错误");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        }

        // 检查员工状态
        if (employee.getStatus() != Employee.EmployeeStatus.active) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "账户已被禁用");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        // 登录成功，返回用户信息
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "登录成功");
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", employee.getId());
        userInfo.put("name", employee.getName());
        userInfo.put("phone", employee.getPhone());
        userInfo.put("email", employee.getEmail());
        userInfo.put("role", employee.getRole());
        userInfo.put("position", employee.getPosition());
        
        response.put("user", userInfo);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "登出成功");
        return ResponseEntity.ok(response);
    }
}

