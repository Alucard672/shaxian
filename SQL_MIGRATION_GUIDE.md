# SQL 数据库迁移指南

## 概述

本指南将帮助您将项目从 localStorage 迁移到 SQL 数据库。

## 架构设计

### 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL / PostgreSQL / SQLite
- **前端**: React (保持不变，只需修改 API 调用)

### 目录结构

```
shaxian/
├── database/          # 数据库相关
│   ├── schema.sql     # 数据库表结构
│   └── README.md      # 数据库说明
├── server/            # 后端 API 服务
│   ├── src/
│   │   ├── index.js   # 服务器入口
│   │   ├── db/        # 数据库连接
│   │   └── routes/    # API 路由
│   └── package.json
└── src/               # 前端代码（保持不变）
```

## 部署步骤

### 1. 准备数据库

#### MySQL

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE shaxian_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 导入表结构
mysql -u root -p shaxian_erp < database/schema.sql
```

#### PostgreSQL

```bash
# 创建数据库
createdb shaxian_erp

# 导入表结构（需要先修改 schema.sql 中的语法）
psql -U postgres -d shaxian_erp -f database/schema.sql
```

### 2. 配置后端服务

```bash
# 进入 server 目录
cd server

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=shaxian_erp
```

### 3. 启动后端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 修改前端代码

#### 4.1 创建 API 客户端

创建 `src/api/client.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
```

#### 4.2 修改 Store

以 `productStore.ts` 为例：

```typescript
import { create } from 'zustand';
import { api } from '@/api/client';

export const useProductStore = create((set, get) => ({
  products: [],
  colors: [],
  batches: [],

  // 加载数据
  loadProducts: async () => {
    try {
      const products = await api.get('/products');
      set({ products });
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  },

  // 添加商品
  addProduct: async (data) => {
    try {
      const product = await api.post('/products', data);
      set((state) => ({ products: [...state.products, product] }));
      return product;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  // ... 其他方法类似
}));
```

### 5. 数据迁移

如果需要从 localStorage 迁移现有数据：

```bash
# 运行迁移脚本
cd server
npm run migrate
```

## 部署到生产环境

### 选项 1: 使用云服务

#### Vercel / Netlify (前端) + Railway / Render (后端)

1. **部署后端**:
   - 将 `server/` 目录推送到 GitHub
   - 在 Railway/Render 创建新项目
   - 连接 GitHub 仓库
   - 配置环境变量
   - 部署

2. **部署前端**:
   - 修改前端 `.env` 文件，设置 `VITE_API_BASE_URL`
   - 推送到 GitHub
   - 在 Vercel/Netlify 部署

#### 使用云数据库

- **MySQL**: AWS RDS, Google Cloud SQL, Azure Database
- **PostgreSQL**: Supabase, Neon, Railway
- **SQLite**: 适合小型部署，使用文件存储

### 选项 2: 自建服务器

1. **安装 Node.js 和 MySQL**
2. **克隆代码并安装依赖**
3. **配置 Nginx 反向代理**
4. **使用 PM2 管理进程**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd server
pm2 start src/index.js --name shaxian-api

# 设置开机自启
pm2 startup
pm2 save
```

## API 端点列表

### 商品管理
- `GET /api/products` - 获取所有商品
- `GET /api/products/:id` - 获取单个商品
- `POST /api/products` - 创建商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品
- `GET /api/products/:id/colors` - 获取商品色号
- `POST /api/products/:id/colors` - 创建色号
- `GET /api/products/colors/:colorId/batches` - 获取色号缸号
- `POST /api/products/colors/:colorId/batches` - 创建缸号

### 往来单位
- `GET /api/contacts/customers` - 获取所有客户
- `POST /api/contacts/customers` - 创建客户
- `PUT /api/contacts/customers/:id` - 更新客户
- `DELETE /api/contacts/customers/:id` - 删除客户
- `GET /api/contacts/suppliers` - 获取所有供应商
- `POST /api/contacts/suppliers` - 创建供应商
- `PUT /api/contacts/suppliers/:id` - 更新供应商
- `DELETE /api/contacts/suppliers/:id` - 删除供应商

### 进货单
- `GET /api/purchases` - 获取所有进货单
- `GET /api/purchases/:id` - 获取单个进货单
- `POST /api/purchases` - 创建进货单
- `PUT /api/purchases/:id` - 更新进货单
- `DELETE /api/purchases/:id` - 删除进货单

### 销售单
- `GET /api/sales` - 获取所有销售单
- `GET /api/sales/:id` - 获取单个销售单
- `POST /api/sales` - 创建销售单
- `PUT /api/sales/:id` - 更新销售单
- `DELETE /api/sales/:id` - 删除销售单

## 注意事项

1. **安全性**
   - 使用 HTTPS
   - 实现身份验证（JWT）
   - 使用环境变量存储敏感信息
   - 防止 SQL 注入（使用参数化查询）

2. **性能**
   - 使用数据库连接池
   - 添加适当的索引
   - 实现分页查询
   - 使用缓存（Redis）

3. **备份**
   - 定期备份数据库
   - 保留多个备份版本

4. **监控**
   - 监控 API 响应时间
   - 监控数据库性能
   - 设置错误日志

## 下一步

1. ✅ 完成数据库 Schema 设计
2. ⏳ 实现所有 API 路由
3. ⏳ 创建 API 客户端
4. ⏳ 修改前端 Stores
5. ⏳ 实现身份验证
6. ⏳ 添加数据验证
7. ⏳ 编写测试
8. ⏳ 部署到生产环境





