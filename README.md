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

## 许可证

MIT


