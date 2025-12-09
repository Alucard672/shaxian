# SQL 数据库迁移检查清单

## ✅ 已完成

- [x] 数据库 Schema 设计
- [x] 后端 API 服务框架
- [x] 所有 API 路由实现
  - [x] 商品管理 API
  - [x] 往来单位 API
  - [x] 进货单 API
  - [x] 销售单 API
  - [x] 染色加工单 API
  - [x] 账款 API
  - [x] 库存 API（调整单、盘点单）
  - [x] 系统设置 API
  - [x] 打印模板 API
- [x] 前端 API 客户端
- [x] 迁移文档和示例

## ⏳ 待完成

### 1. 前端 Store 迁移

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

### 2. 组件更新

- [ ] 更新所有使用 Store 的组件
- [ ] 添加加载状态显示
- [ ] 添加错误处理
- [ ] 更新数据加载逻辑（useEffect）

### 3. 环境配置

- [ ] 创建 `.env` 文件
- [ ] 配置 `VITE_API_BASE_URL`
- [ ] 配置后端 `.env` 文件
- [ ] 配置数据库连接

### 4. 数据库设置

- [ ] 创建数据库
- [ ] 导入 Schema
- [ ] 测试数据库连接
- [ ] 配置数据库备份

### 5. 测试

- [ ] 单元测试 API 路由
- [ ] 集成测试前端到后端
- [ ] 端到端测试完整流程
- [ ] 性能测试
- [ ] 错误处理测试

### 6. 部署

- [ ] 配置生产环境数据库
- [ ] 部署后端服务
- [ ] 部署前端应用
- [ ] 配置 HTTPS
- [ ] 配置域名和 DNS
- [ ] 设置监控和日志

### 7. 数据迁移（如果需要）

- [ ] 导出 localStorage 数据
- [ ] 编写数据导入脚本
- [ ] 验证数据完整性
- [ ] 执行数据导入

### 8. 文档

- [ ] API 文档
- [ ] 部署文档
- [ ] 用户手册更新
- [ ] 开发者文档

## 优先级

### 高优先级（必须完成）

1. 前端 Store 迁移（至少核心模块）
2. 环境配置
3. 数据库设置
4. 基本测试

### 中优先级（建议完成）

1. 所有 Store 迁移
2. 组件更新
3. 完整测试
4. 数据迁移

### 低优先级（可选）

1. 性能优化
2. 监控和日志
3. 文档完善

## 快速开始

### 1. 设置数据库

```bash
mysql -u root -p
CREATE DATABASE shaxian_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

mysql -u root -p shaxian_erp < database/schema.sql
```

### 2. 配置后端

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 文件
npm run dev
```

### 3. 配置前端

```bash
# 在项目根目录
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
npm run dev
```

### 4. 开始迁移 Store

参考 `STORE_MIGRATION_EXAMPLE.md` 开始迁移第一个 Store。

## 预计时间

- 单个 Store 迁移: 30-60 分钟
- 所有 Store 迁移: 5-10 小时
- 测试和调试: 2-4 小时
- 部署: 1-2 小时

**总计**: 约 1-2 个工作日

## 注意事项

1. **逐步迁移**: 建议先迁移一个模块，测试通过后再迁移其他模块
2. **保留备份**: 迁移前备份所有 Store 文件
3. **测试优先**: 每迁移一个 Store 就进行测试
4. **文档更新**: 及时更新相关文档


