-- 初始化测试用户账号
-- 确保password字段存在（如果不存在则添加）
SET @dbname = DATABASE();
SET @tablename = 'employees';
SET @columnname = 'password';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NULL AFTER role')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 插入或更新测试管理员账号
INSERT INTO employees (id, name, phone, role, password, status, created_at, updated_at) 
VALUES ('emp-admin-001', '系统管理员', '13800138000', 'role-boss', '123456', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    password = '123456',
    status = 'active',
    updated_at = NOW();

-- 验证插入结果
SELECT id, name, phone, role, password, status FROM employees WHERE phone = '13800138000';

