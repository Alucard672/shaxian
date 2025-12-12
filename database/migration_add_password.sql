-- 为employees表添加password字段
-- 如果字段已存在则忽略错误

ALTER TABLE employees 
ADD COLUMN password VARCHAR(255) NULL AFTER role;

-- 更新现有员工的默认密码为123456
UPDATE employees SET password = '123456' WHERE password IS NULL OR password = '';


