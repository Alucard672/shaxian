#!/bin/bash

# 初始化测试用户脚本
# 使用方法: ./database/执行初始化.sh

echo "=== 初始化测试用户 ==="
echo ""
echo "请输入MySQL root密码："
read -s MYSQL_PWD

mysql -u root -p"$MYSQL_PWD" shaxian_erp <<EOF
-- 添加password字段（如果已存在会报错，可以忽略）
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
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 测试用户初始化成功！"
    echo ""
    echo "测试账号信息："
    echo "  手机号: 13800138000"
    echo "  密码: 123456"
    echo ""
    echo "现在可以运行测试："
    echo "  npm run test:auth"
else
    echo ""
    echo "❌ 初始化失败，请检查错误信息"
fi


