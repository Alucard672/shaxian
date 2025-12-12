-- 默认打印模板
-- 清理旧数据（按主键）
DELETE FROM print_templates WHERE id = 'tpl-default-sales';
DELETE FROM roles WHERE id IN ('role-boss','role-sales','role-accountant');

-- 默认打印模板
INSERT INTO print_templates (
    id, name, type, description, is_default, document_type,
    page_settings, title_settings, basic_info_fields, product_fields,
    summary_fields, other_elements, usage_count, created_at, updated_at
) VALUES (
    'tpl-default-sales',
    '标准销售单模板',
    'A4模板',
    '系统内置的销售单打印模板',
    true,
    '销售单',
    '{\"pageSize\":\"A4\",\"orientation\":\"portrait\",\"margins\":\"10mm\"}',
    '{\"title\":\"销售单\",\"showLogo\":true}',
    '[\"orderNumber\",\"customer\",\"date\",\"operator\"]',
    '[\"productCode\",\"productName\",\"specification\",\"colorName\",\"colorCode\",\"batchCode\",\"quantity\",\"unit\",\"unitPrice\",\"amount\",\"remark\"]',
    '[\"totalAmount\",\"remark\"]',
    '[]',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 角色初始化：老板（全部权限）
INSERT INTO roles (id, name, description, permissions, created_at, updated_at) VALUES (
    'role-boss',
    '老板',
    '系统管理员，拥有全部权限',
    '[\"*\"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 角色初始化：销售
INSERT INTO roles (id, name, description, permissions, created_at, updated_at) VALUES (
    'role-sales',
    '销售',
    '销售相关权限',
    '[\"sales\",\"products\",\"contacts\",\"inventory.read\",\"templates\"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 角色初始化：会计
INSERT INTO roles (id, name, description, permissions, created_at, updated_at) VALUES (
    'role-accountant',
    '会计',
    '财务结算相关权限',
    '[\"accounts\",\"purchases\",\"sales\",\"reports\"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 默认管理员员工（如果不存在）
INSERT IGNORE INTO employees (id, name, phone, role, password, status, created_at, updated_at) VALUES (
    'emp-admin-001',
    '系统管理员',
    '13800138000',
    'role-boss',
    '123456',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

