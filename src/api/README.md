# API 客户端使用说明

## 概述

`src/api/client.js` 提供了所有后端 API 的封装，方便前端调用。

## 配置

在 `.env` 文件中设置 API 基础 URL：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

如果不设置，默认使用 `http://localhost:3000/api`。

## 使用示例

### 商品管理

```javascript
import { productApi } from '@/api/client';

// 获取所有商品
const products = await productApi.getAll();

// 创建商品
const newProduct = await productApi.create({
  name: '32支棉纱',
  code: 'PROD001',
  unit: 'kg',
  type: '原料'
});

// 更新商品
await productApi.update(productId, { name: '新名称' });

// 删除商品
await productApi.delete(productId);
```

### 销售单

```javascript
import { salesApi } from '@/api/client';

// 获取所有销售单
const orders = await salesApi.getAll({ status: '已出库' });

// 创建销售单
const order = await salesApi.create({
  customerId: 'customer-001',
  customerName: '客户名称',
  salesDate: '2024-01-01',
  items: [...],
  receivedAmount: 0
});
```

### 错误处理

```javascript
import { productApi } from '@/api/client';

try {
  const products = await productApi.getAll();
} catch (error) {
  console.error('获取商品失败:', error.message);
  // 显示错误提示给用户
}
```

## API 列表

### 商品 API (productApi)
- `getAll()` - 获取所有商品
- `getById(id)` - 获取单个商品
- `create(data)` - 创建商品
- `update(id, data)` - 更新商品
- `delete(id)` - 删除商品
- `getColors(productId)` - 获取商品色号
- `createColor(productId, data)` - 创建色号
- `getBatches(colorId)` - 获取色号缸号
- `createBatch(colorId, data)` - 创建缸号

### 往来单位 API (contactApi)
- `getAllCustomers()` - 获取所有客户
- `getCustomer(id)` - 获取单个客户
- `createCustomer(data)` - 创建客户
- `updateCustomer(id, data)` - 更新客户
- `deleteCustomer(id)` - 删除客户
- `getAllSuppliers()` - 获取所有供应商
- `getSupplier(id)` - 获取单个供应商
- `createSupplier(data)` - 创建供应商
- `updateSupplier(id, data)` - 更新供应商
- `deleteSupplier(id)` - 删除供应商

### 进货单 API (purchaseApi)
- `getAll(params)` - 获取所有进货单
- `getById(id)` - 获取单个进货单
- `create(data)` - 创建进货单
- `update(id, data)` - 更新进货单
- `delete(id)` - 删除进货单

### 销售单 API (salesApi)
- `getAll(params)` - 获取所有销售单
- `getById(id)` - 获取单个销售单
- `create(data)` - 创建销售单
- `update(id, data)` - 更新销售单
- `delete(id)` - 删除销售单
- `checkStock(batchId, quantity)` - 检查库存

### 染色加工单 API (dyeingApi)
- `getAll(params)` - 获取所有染色加工单
- `getById(id)` - 获取单个染色加工单
- `create(data)` - 创建染色加工单
- `update(id, data)` - 更新染色加工单
- `delete(id)` - 删除染色加工单

### 账款 API (accountApi)
- `getAllReceivables(params)` - 获取所有应收账款
- `createReceivable(data)` - 创建应收账款
- `getReceipts(id)` - 获取收款记录
- `createReceipt(id, data)` - 创建收款记录
- `getAllPayables(params)` - 获取所有应付账款
- `createPayable(data)` - 创建应付账款
- `getPayments(id)` - 获取付款记录
- `createPayment(id, data)` - 创建付款记录

### 库存 API (inventoryApi)
- `getAllAdjustments(params)` - 获取所有库存调整单
- `getAdjustment(id)` - 获取单个库存调整单
- `createAdjustment(data)` - 创建库存调整单
- `updateAdjustment(id, data)` - 更新库存调整单
- `deleteAdjustment(id)` - 删除库存调整单
- `getAllChecks(params)` - 获取所有盘点单
- `getCheck(id)` - 获取单个盘点单
- `createCheck(data)` - 创建盘点单
- `updateCheck(id, data)` - 更新盘点单
- `deleteCheck(id)` - 删除盘点单

### 系统设置 API (settingsApi)
- `getStoreInfo()` - 获取门店信息
- `updateStoreInfo(data)` - 更新门店信息
- `getAllEmployees()` - 获取所有员工
- `getEmployee(id)` - 获取单个员工
- `createEmployee(data)` - 创建员工
- `updateEmployee(id, data)` - 更新员工
- `deleteEmployee(id)` - 删除员工
- `getAllRoles()` - 获取所有角色
- `createRole(data)` - 创建角色
- `updateRole(id, data)` - 更新角色
- `deleteRole(id)` - 删除角色
- `getAllQueries(params)` - 获取所有自定义查询
- `createQuery(data)` - 创建自定义查询
- `getInventoryAlert()` - 获取库存预警设置
- `updateInventoryAlert(data)` - 更新库存预警设置
- `getParams()` - 获取系统参数
- `updateParams(data)` - 更新系统参数

### 打印模板 API (templateApi)
- `getAll(params)` - 获取所有打印模板
- `getById(id)` - 获取单个打印模板
- `create(data)` - 创建打印模板
- `update(id, data)` - 更新打印模板
- `delete(id)` - 删除打印模板
- `incrementUsage(id)` - 增加使用次数





