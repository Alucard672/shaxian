# 数据库 Schema 说明

## 数据库选择

本 Schema 设计支持以下数据库：

- **MySQL 5.7+**（推荐用于生产环境）
- **PostgreSQL 10+**（推荐用于生产环境）
- **SQLite 3**（适合开发和小型部署）

## 表结构说明

### 核心业务表

1. **商品相关**
   - `products` - 商品表
   - `colors` - 色号表
   - `batches` - 缸号表

2. **往来单位**
   - `customers` - 客户表
   - `suppliers` - 供应商表

3. **订单相关**
   - `purchase_orders` + `purchase_order_items` - 进货单
   - `sales_orders` + `sales_order_items` - 销售单
   - `dyeing_orders` + `dyeing_order_items` - 染色加工单

4. **账款相关**
   - `account_receivables` - 应收账款
   - `receipt_records` - 收款记录
   - `account_payables` - 应付账款
   - `payment_records` - 付款记录

5. **库存相关**
   - `adjustment_orders` + `adjustment_order_items` - 库存调整单
   - `inventory_check_orders` + `inventory_check_items` - 盘点单

6. **系统设置**
   - `store_info` - 门店信息（单条记录）
   - `employees` - 员工表
   - `roles` - 角色表
   - `custom_queries` - 自定义查询
   - `inventory_alert_settings` - 库存预警设置（单条记录）
   - `system_params` - 系统参数（单条记录）

7. **打印模板**
   - `print_templates` - 打印模板表

## 字段说明

### 通用字段

- `id` - 主键，使用 VARCHAR(50) 存储 UUID 或自定义 ID
- `created_at` - 创建时间，自动设置为当前时间
- `updated_at` - 更新时间，自动更新

### 金额字段

所有金额字段使用 `DECIMAL(12, 2)` 类型，支持最大 999,999,999,999.99

### 数量字段

所有数量字段使用 `DECIMAL(10, 2)` 类型，支持小数

### 枚举字段

使用 `ENUM` 类型存储固定的选项值，如状态、类型等

## 索引设计

- 主键自动创建索引
- 外键字段创建索引
- 常用查询字段创建索引（如 `order_number`, `code`, `status` 等）

## 外键约束

- 使用 `ON DELETE CASCADE` 确保数据一致性
- 删除主表记录时，自动删除关联的子表记录

## 使用说明

### MySQL

```bash
mysql -u root -p your_database < database/schema.sql
```

### PostgreSQL

需要先修改 SQL 文件中的语法：
- `ENUM` 改为 `VARCHAR` 或创建自定义类型
- `DATETIME` 改为 `TIMESTAMP`
- `AUTO_INCREMENT` 改为 `SERIAL` 或使用序列

### SQLite

SQLite 不支持 `ENUM`，需要改为 `TEXT` 类型，并在应用层进行验证。

## 数据迁移

从 localStorage 迁移到 SQL 数据库时，需要：

1. 导出 localStorage 中的数据（JSON 格式）
2. 编写数据导入脚本，将 JSON 数据转换为 SQL INSERT 语句
3. 执行导入脚本

## 注意事项

1. **字符集**：建议使用 `utf8mb4` 字符集，支持 emoji 等特殊字符
2. **时区**：建议使用 UTC 时区存储时间，在应用层转换为本地时区
3. **备份**：定期备份数据库，建议每天自动备份
4. **性能**：大量数据时，考虑添加更多索引或使用分区表

