-- 沙县ERP系统数据库 Schema
-- 支持 MySQL 5.7+ / PostgreSQL 10+ / SQLite 3

-- ========== 商品相关表 ==========

-- 商品表
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  specification VARCHAR(100),
  composition VARCHAR(200),
  count VARCHAR(50),
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  type ENUM('原料', '半成品', '成品') NOT NULL DEFAULT '原料',
  is_white_yarn BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_type (type)
);

-- 色号表
CREATE TABLE colors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color_value VARCHAR(20),
  description TEXT,
  status ENUM('在售', '停售') NOT NULL DEFAULT '在售',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_code (code)
);

-- 缸号表
CREATE TABLE batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  color_id BIGINT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  production_date DATE,
  supplier_id BIGINT,
  supplier_name VARCHAR(200),
  purchase_price DECIMAL(10, 2),
  stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  initial_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_location VARCHAR(100),
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
  INDEX idx_color_id (color_id),
  INDEX idx_code (code),
  INDEX idx_stock_quantity (stock_quantity)
);

-- ========== 往来单位表 ==========

-- 客户表
CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  type ENUM('直客', '经销商') NOT NULL DEFAULT '直客',
  credit_limit DECIMAL(12, 2),
  status ENUM('正常', '冻结') NOT NULL DEFAULT '正常',
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- 供应商表
CREATE TABLE suppliers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  type ENUM('厂家', '贸易商') NOT NULL DEFAULT '厂家',
  settlement_cycle ENUM('现结', '月结', '季结') NOT NULL DEFAULT '现结',
  status ENUM('合作中', '已停用') NOT NULL DEFAULT '合作中',
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- ========== 进货单相关表 ==========

-- 进货单表
CREATE TABLE purchase_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id BIGINT NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  purchase_date DATE NOT NULL,
  expected_date DATE,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unpaid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('草稿', '待审核', '已审核', '已入库', '已作废') NOT NULL DEFAULT '草稿',
  operator VARCHAR(100),
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  INDEX idx_order_number (order_number),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_purchase_date (purchase_date),
  INDEX idx_status (status)
);

-- 进货单明细表
CREATE TABLE purchase_order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  color_id BIGINT,
  color_name VARCHAR(100),
  color_code VARCHAR(50),
  batch_code VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  production_date DATE,
  stock_location VARCHAR(100),
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);

-- ========== 销售单相关表 ==========

-- 销售单表
CREATE TABLE sales_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id BIGINT NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  sales_date DATE NOT NULL,
  expected_date DATE,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  received_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unpaid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('草稿', '待审核', '已审核', '已出库', '已作废') NOT NULL DEFAULT '草稿',
  operator VARCHAR(100),
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_order_number (order_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_sales_date (sales_date),
  INDEX idx_status (status)
);

-- 销售单明细表
CREATE TABLE sales_order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  color_id BIGINT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL,
  batch_id BIGINT NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_batch_id (batch_id)
);

-- ========== 染色加工单相关表 ==========

-- 染色加工单表
CREATE TABLE dyeing_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  grey_batch_id BIGINT NOT NULL,
  grey_batch_code VARCHAR(50) NOT NULL,
  factory_id BIGINT,
  factory_name VARCHAR(200) NOT NULL,
  factory_phone VARCHAR(50),
  shipment_date DATE NOT NULL,
  expected_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  processing_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('待发货', '加工中', '已完成', '已入库', '已取消') NOT NULL DEFAULT '待发货',
  operator VARCHAR(100),
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (grey_batch_id) REFERENCES batches(id),
  INDEX idx_order_number (order_number),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);

-- 染色加工单明细表
CREATE TABLE dyeing_order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  target_color_id BIGINT NOT NULL,
  target_color_code VARCHAR(50) NOT NULL,
  target_color_name VARCHAR(100) NOT NULL,
  target_color_value VARCHAR(20),
  quantity DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES dyeing_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (target_color_id) REFERENCES colors(id),
  INDEX idx_order_id (order_id),
  INDEX idx_target_color_id (target_color_id)
);

-- ========== 账款相关表 ==========

-- 应收账款表
CREATE TABLE account_receivables (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  sales_order_id BIGINT NOT NULL,
  sales_order_number VARCHAR(50) NOT NULL,
  receivable_amount DECIMAL(12, 2) NOT NULL,
  received_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unpaid_amount DECIMAL(12, 2) NOT NULL,
  account_date DATE NOT NULL,
  status ENUM('未结清', '已结清') NOT NULL DEFAULT '未结清',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_status (status)
);

-- 收款记录表
CREATE TABLE receipt_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_receivable_id BIGINT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('现金', '转账', '支票', '其他') NOT NULL DEFAULT '转账',
  receipt_date DATE NOT NULL,
  operator VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_receivable_id) REFERENCES account_receivables(id) ON DELETE CASCADE,
  INDEX idx_account_receivable_id (account_receivable_id),
  INDEX idx_receipt_date (receipt_date)
);

-- 应付账款表
CREATE TABLE account_payables (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  supplier_id BIGINT NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  purchase_order_id BIGINT NOT NULL,
  purchase_order_number VARCHAR(50) NOT NULL,
  payable_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unpaid_amount DECIMAL(12, 2) NOT NULL,
  account_date DATE NOT NULL,
  status ENUM('未结清', '已结清') NOT NULL DEFAULT '未结清',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_purchase_order_id (purchase_order_id),
  INDEX idx_status (status)
);

-- 付款记录表
CREATE TABLE payment_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_payable_id BIGINT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('现金', '转账', '支票', '其他') NOT NULL DEFAULT '转账',
  payment_date DATE NOT NULL,
  operator VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_payable_id) REFERENCES account_payables(id) ON DELETE CASCADE,
  INDEX idx_account_payable_id (account_payable_id),
  INDEX idx_payment_date (payment_date)
);

-- ========== 库存相关表 ==========

-- 库存调整单表
CREATE TABLE adjustment_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('调增', '调减', '盘盈', '盘亏', '报损', '其他') NOT NULL,
  adjustment_date DATE NOT NULL,
  total_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('草稿', '已完成') NOT NULL DEFAULT '草稿',
  operator VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_number (order_number),
  INDEX idx_adjustment_date (adjustment_date),
  INDEX idx_status (status)
);

-- 库存调整单明细表
CREATE TABLE adjustment_order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  batch_id BIGINT NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  color_id BIGINT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES adjustment_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_order_id (order_id),
  INDEX idx_batch_id (batch_id)
);

-- 盘点单表
CREATE TABLE inventory_check_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  plan_date DATE NOT NULL,
  progress_total INT NOT NULL DEFAULT 0,
  progress_completed INT NOT NULL DEFAULT 0,
  surplus DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deficit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('计划中', '盘点中', '已完成', '已取消') NOT NULL DEFAULT '计划中',
  operator VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_number (order_number),
  INDEX idx_plan_date (plan_date),
  INDEX idx_status (status)
);

-- 盘点单明细表
CREATE TABLE inventory_check_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  batch_id BIGINT NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  color_id BIGINT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL,
  system_quantity DECIMAL(10, 2) NOT NULL,
  actual_quantity DECIMAL(10, 2),
  difference DECIMAL(10, 2),
  unit VARCHAR(20) NOT NULL,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES inventory_check_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_order_id (order_id),
  INDEX idx_batch_id (batch_id)
);

-- ========== 系统设置表 ==========

-- 门店信息表（单条记录）
CREATE TABLE store_info (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200),
  code VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  fax VARCHAR(50),
  postal_code VARCHAR(20),
  remark TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 员工表
CREATE TABLE employees (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  role VARCHAR(100),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

-- 角色表
CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions TEXT, -- JSON 格式存储权限数组
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 自定义查询表
CREATE TABLE custom_queries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  module VARCHAR(50) NOT NULL,
  conditions TEXT, -- JSON 格式存储查询条件
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module (module)
);

-- 库存预警设置表（单条记录）
CREATE TABLE inventory_alert_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  threshold DECIMAL(10, 2),
  auto_alert BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 系统参数表（单条记录）
CREATE TABLE system_params (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enable_dyeing_process BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========== 打印模板表 ==========

-- 打印模板表
CREATE TABLE print_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  type ENUM('A4模板', '三联单') NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  document_type ENUM('销售单', '进货单') NOT NULL,
  page_settings TEXT, -- JSON 格式
  title_settings TEXT, -- JSON 格式
  basic_info_fields TEXT, -- JSON 格式
  product_fields TEXT, -- JSON 格式
  summary_fields TEXT, -- JSON 格式
  other_elements TEXT, -- JSON 格式
  usage_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_type (document_type),
  INDEX idx_is_default (is_default)
);

-- ========== 初始化数据 ==========

-- 初始化门店信息（空记录）
INSERT INTO store_info (name) VALUES ('');

-- 初始化库存预警设置（默认值）
INSERT INTO inventory_alert_settings (enabled, auto_alert) VALUES (FALSE, FALSE);

-- 初始化系统参数（默认值）
INSERT INTO system_params (enable_dyeing_process) VALUES (FALSE);





