# Store 迁移示例

## 从 localStorage 迁移到 API

本文档展示如何将 Store 从使用 localStorage 迁移到使用 API。

## 迁移前（localStorage 版本）

```typescript
// src/store/productStore.ts (旧版本)
import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

export const useProductStore = create((set, get) => ({
  products: loadFromStorage('products', []),
  
  addProduct: (data) => {
    const newProduct = { id: generateId(), ...data };
    set((state) => {
      const products = [...state.products, newProduct];
      saveToStorage('products', products);
      return { products };
    });
    return newProduct;
  },
  
  // ...
}));
```

## 迁移后（API 版本）

```typescript
// src/store/productStore.ts (新版本)
import { create } from 'zustand';
import { productApi } from '@/api/client';

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,
  
  // 加载数据
  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productApi.getAll();
      set({ products, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to load products:', error);
    }
  },
  
  // 添加商品
  addProduct: async (data) => {
    try {
      const newProduct = await productApi.create(data);
      set((state) => ({
        products: [...state.products, newProduct]
      }));
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },
  
  // 更新商品
  updateProduct: async (id, data) => {
    try {
      const updated = await productApi.update(id, data);
      set((state) => ({
        products: state.products.map(p => p.id === id ? updated : p)
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },
  
  // 删除商品
  deleteProduct: async (id) => {
    try {
      await productApi.delete(id);
      set((state) => ({
        products: state.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },
  
  // ...
}));
```

## 在组件中使用

### 迁移前

```typescript
function ProductList() {
  const { products } = useProductStore();
  
  // 数据已经在 Store 初始化时从 localStorage 加载
  return <div>{/* 渲染商品列表 */}</div>;
}
```

### 迁移后

```typescript
import { useEffect } from 'react';

function ProductList() {
  const { products, loading, error, loadProducts } = useProductStore();
  
  useEffect(() => {
    loadProducts(); // 组件挂载时加载数据
  }, [loadProducts]);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  
  return <div>{/* 渲染商品列表 */}</div>;
}
```

## 关键变化

### 1. 数据加载

**之前**: 数据在 Store 初始化时自动从 localStorage 加载
```typescript
products: loadFromStorage('products', [])
```

**之后**: 需要显式调用加载方法
```typescript
products: [],
loadProducts: async () => { /* ... */ }
```

### 2. 异步操作

**之前**: 同步操作，直接修改状态
```typescript
addProduct: (data) => {
  const newProduct = { id: generateId(), ...data };
  set((state) => ({ products: [...state.products, newProduct] }));
}
```

**之后**: 异步操作，需要 await API 调用
```typescript
addProduct: async (data) => {
  const newProduct = await productApi.create(data);
  set((state) => ({ products: [...state.products, newProduct] }));
}
```

### 3. 错误处理

**之前**: 不需要错误处理（localStorage 操作不会失败）

**之后**: 需要处理 API 错误
```typescript
try {
  await productApi.create(data);
} catch (error) {
  console.error('Failed:', error);
  // 显示错误提示给用户
}
```

### 4. 加载状态

**之前**: 不需要加载状态（数据立即可用）

**之后**: 需要加载状态
```typescript
loading: false,
error: null,
loadProducts: async () => {
  set({ loading: true });
  try {
    const data = await productApi.getAll();
    set({ products: data, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
  }
}
```

## 需要迁移的 Store 列表

- [ ] `productStore.ts` - 商品管理
- [ ] `contactStore.ts` - 往来单位
- [ ] `purchaseStore.ts` - 进货单
- [ ] `salesStore.ts` - 销售单
- [ ] `dyeingStore.ts` - 染色加工单
- [ ] `accountStore.ts` - 账款
- [ ] `adjustmentStore.ts` - 库存调整
- [ ] `inventoryCheckStore.ts` - 盘点单
- [ ] `settingsStore.ts` - 系统设置
- [ ] `templateStore.ts` - 打印模板

## 迁移步骤

1. **备份当前 Store 文件**
2. **导入 API 客户端**
   ```typescript
   import { productApi } from '@/api/client';
   ```
3. **移除 localStorage 相关代码**
   - 移除 `loadFromStorage` 和 `saveToStorage` 调用
   - 移除 `generateId`（ID 由后端生成）
4. **添加加载方法**
   ```typescript
   loadProducts: async () => { /* ... */ }
   ```
5. **修改所有操作方法为异步**
   - `addProduct` → `async addProduct`
   - `updateProduct` → `async updateProduct`
   - 等等
6. **添加错误处理**
7. **更新组件使用方式**
   - 在 `useEffect` 中调用加载方法
   - 处理加载状态和错误

## 注意事项

1. **ID 生成**: 后端会自动生成 ID，不需要前端生成
2. **日期格式**: 确保日期格式与后端一致（通常是 ISO 字符串）
3. **数据转换**: 某些字段名可能需要转换（如 `createdAt` vs `created_at`）
4. **事务操作**: 某些操作（如创建订单）需要等待后端完成后再更新状态
5. **乐观更新**: 可以考虑先更新 UI，失败时回滚

## 测试

迁移后需要测试：

1. ✅ 数据加载是否正常
2. ✅ 创建操作是否成功
3. ✅ 更新操作是否成功
4. ✅ 删除操作是否成功
5. ✅ 错误处理是否正常
6. ✅ 加载状态是否正确显示

