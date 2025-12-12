-- 初始化测试用户账号（简化版）
-- 注意：如果password字段已存在，执行此脚本会报错，可以忽略

-- 添加password字段（如果不存在）
ALTER TABLE employees ADD COLUMN password VARCHAR(255) NULL AFTER role;

-- 插入或更新测试管理员账号
INSERT INTO employees (id, name, phone, role, password, status, created_at, updated_at) 
VALUES ('emp-admin-001', '系统管理员', '13800138000', 'role-boss', '123456', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    password = '123456',
    status = 'active',
    updated_at = NOW();

-- 验证插入结果
SELECT id, name, phone, role, password, status FROM employees WHERE phone = '13800138000';


