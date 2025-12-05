# SQL 数据库迁移方案

## 📋 概述

本项目已准备好从 localStorage 迁移到 SQL 数据库的完整方案。

## 🗂️ 已创建的文件

### 1. 数据库 Schema
- `database/schema.sql` - 完整的数据库表结构（支持 MySQL/PostgreSQL）
- `database/README.md` - 数据库说明文档

### 2. 后端 API 服务
- `server/package.json` - 后端依赖配置
- `server/src/index.js` - Express 服务器入口
- `server/src/db/connection.js` - 数据库连接模块
- `server/src/routes/products.js` - 商品管理 API 路由示例
- `server/.env.example` - 环境变量配置示例

### 3. 文档
- `SQL_MIGRATION_GUIDE.md` - 完整的迁移指南

## 🚀 快速开始

### 步骤 1: 准备数据库

```bash
# MySQL
mysql -u root -p
CREATE DATABASE shaxian_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

mysql -u root -p shaxian_erp < database/schema.sql
```

### 步骤 2: 配置后端

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

### 步骤 3: 启动后端服务

```bash
npm run dev
```

后端服务将在 `http://localhost:3000` 启动。

## 📝 下一步工作

### 需要完成的任务

1. **实现所有 API 路由**
   - [ ] 往来单位 API (`server/src/routes/contacts.js`)
   - [ ] 进货单 API (`server/src/routes/purchases.js`)
   - [ ] 销售单 API (`server/src/routes/sales.js`)
   - [ ] 染色加工单 API (`server/src/routes/dyeing.js`)
   - [ ] 账款 API (`server/src/routes/accounts.js`)
   - [ ] 库存 API (`server/src/routes/inventory.js`)
   - [ ] 设置 API (`server/src/routes/settings.js`)
   - [ ] 模板 API (`server/src/routes/templates.js`)

2. **创建前端 API 客户端**
   - [ ] 创建 `src/api/client.js`
   - [ ] 封装所有 API 请求

3. **修改前端 Stores**
   - [ ] 修改 `productStore.ts` 使用 API
   - [ ] 修改 `contactStore.ts` 使用 API
   - [ ] 修改 `purchaseStore.ts` 使用 API
   - [ ] 修改 `salesStore.ts` 使用 API
   - [ ] 修改其他所有 Stores

4. **添加功能**
   - [ ] 身份验证（JWT）
   - [ ] 数据验证
   - [ ] 错误处理
   - [ ] 日志记录

5. **部署**
   - [ ] 配置生产环境
   - [ ] 设置数据库备份
   - [ ] 配置 HTTPS

## 🔧 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL / PostgreSQL / SQLite
- **前端**: React (保持不变)

## 📚 相关文档

- [SQL_MIGRATION_GUIDE.md](./SQL_MIGRATION_GUIDE.md) - 详细迁移指南
- [database/README.md](./database/README.md) - 数据库说明

## ⚠️ 注意事项

1. 当前只实现了商品管理的 API 路由作为示例
2. 需要根据实际需求实现其他模块的 API
3. 建议先完成所有 API 路由，再修改前端代码
4. 生产环境部署前需要添加身份验证和安全性措施

