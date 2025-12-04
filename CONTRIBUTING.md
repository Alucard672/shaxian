# 贡献指南

感谢您对纱线进销存系统的贡献！

## 开发流程

### 1. 分支管理

我们使用 Git Flow 工作流：

- `main` - 主分支，用于生产环境
- `develop` - 开发分支，用于集成开发
- `feature/*` - 功能分支，从 develop 创建
- `fix/*` - 修复分支，从 develop 创建
- `hotfix/*` - 热修复分支，从 main 创建

### 2. 创建功能分支

```bash
# 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/功能名称

# 例如
git checkout -b feature/purchase-management
```

### 3. 提交规范

请遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）:**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

**范围（scope）:**
- `product`: 商品管理
- `purchase`: 进货管理
- `sales`: 销售管理
- `inventory`: 库存管理
- `account`: 账款管理
- `contact`: 客户与供应商
- `ui`: UI组件
- `store`: 状态管理

**示例:**
```bash
git commit -m "feat(purchase): 实现进货单创建功能

- 添加进货单表单组件
- 实现进货单数据验证
- 集成进货单状态管理"
```

### 4. 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS

### 5. 提交 Pull Request

1. 确保代码通过 lint 检查
2. 确保 TypeScript 类型检查通过
3. 更新相关文档（如需要）
4. 创建 Pull Request 到 `develop` 分支
5. 填写 PR 描述，说明变更内容

### 6. 代码审查

- 所有 PR 需要至少一个审查者批准
- 审查者会检查代码质量、测试覆盖等
- 根据反馈修改后重新提交

## 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行 lint
npm run lint

# 构建生产版本
npm run build
```

## 问题反馈

如发现问题，请创建 Issue 并描述：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息

## 功能请求

欢迎提出功能建议！请创建 Issue 并说明：
- 功能描述
- 使用场景
- 预期效果

感谢您的贡献！






