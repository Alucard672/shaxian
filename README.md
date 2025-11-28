# 纱线进销存系统

纱线行业专用的WEB端业务管理系统，支持商品→色号→缸号三层结构管理。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4.0
- **路由**: React Router v6
- **表单**: React Hook Form
- **状态管理**: Zustand
- **图标**: Lucide React
- **图表**: Recharts
- **日期处理**: date-fns

## 项目结构

```
shaxian/
├── src/
│   ├── components/        # 组件库
│   │   ├── ui/           # 基础UI组件
│   │   └── layout/       # 布局组件
│   ├── pages/            # 页面组件
│   ├── routes/           # 路由配置
│   ├── styles/           # 样式文件
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript类型定义
├── public/               # 静态资源
└── package.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 核心功能模块

- ✅ **进货管理** - 进货单创建、审核、入库
- ✅ **销售管理** - 销售单创建、审核、出库
- ✅ **库存管理** - 多维度库存查询与预警
- ✅ **账款管理** - 应收账款、应付账款管理
- ✅ **客户与供应商** - 客户和供应商信息管理
- ✅ **打单管理** - 业务单据打印
- ✅ **统计报表** - 多维度数据统计与分析

## 设计规范

项目遵循统一的设计规范，包括：

- 色彩系统（主色调、成功色、警告色、错误色）
- 字体规范（字号、行高、字重）
- 间距系统（8px基准）
- 组件库规范（按钮、表单、数据展示等）
- 交互规范（悬停、点击、加载状态）

详细设计规范请参考 `纱线进销存系统-设计规范.md`

## 开发规范

- 使用 TypeScript 进行类型检查
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS 类名
- 遵循 ESLint 代码规范

## 版本管理

项目使用语义化版本（Semantic Versioning）进行版本管理。

### 当前版本

**v0.1.0** - 查看 [VERSION.md](./VERSION.md) 了解版本详情

### 版本更新

使用脚本更新版本号：

```bash
# 更新修订号 (0.1.0 -> 0.1.1)
node scripts/version.js patch

# 更新次版本号 (0.1.0 -> 0.2.0)
node scripts/version.js minor

# 更新主版本号 (0.1.0 -> 1.0.0)
node scripts/version.js major
```

### Git 工作流

项目使用 Git Flow 工作流：

- `main` - 主分支（生产环境）
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `hotfix/*` - 热修复分支

详细说明请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 开发规范

### 提交规范

遵循约定式提交规范：

```
<type>(<scope>): <subject>

<body>
```

**类型:**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链

**范围:**
- `product`: 商品管理
- `purchase`: 进货管理
- `sales`: 销售管理
- `inventory`: 库存管理
- `account`: 账款管理
- `contact`: 客户与供应商
- `ui`: UI组件
- `store`: 状态管理

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS

## 许可证

MIT


