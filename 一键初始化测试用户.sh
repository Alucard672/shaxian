#!/bin/bash

# 一键初始化测试用户
# 使用方法: ./一键初始化测试用户.sh

echo "=========================================="
echo "  初始化测试用户"
echo "=========================================="
echo ""

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL未找到，请先安装MySQL"
    exit 1
fi

echo "请输入MySQL root密码："
read -s MYSQL_PASSWORD

echo ""
echo "正在执行初始化..."

mysql -u root -p"$MYSQL_PASSWORD" shaxian_erp 2>&1 <<EOF
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
SELECT '✅ 测试用户初始化成功！' AS status;
SELECT id, name, phone, role, password, status FROM employees WHERE phone = '13800138000';
EOF

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ 初始化完成！"
    echo "=========================================="
    echo ""
    echo "测试账号信息："
    echo "  手机号: 13800138000"
    echo "  密码: 123456"
    echo ""
    echo "现在可以运行测试："
    echo "  npm run test:auth"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ 初始化失败"
    echo "=========================================="
    echo ""
    echo "可能的原因："
    echo "  1. MySQL密码错误"
    echo "  2. 数据库 shaxian_erp 不存在"
    echo "  3. employees 表不存在"
    echo ""
    echo "请检查错误信息并重试"
    echo ""
fi


