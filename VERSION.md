# 版本管理规范

## 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/) (Semantic Versioning) 规范：

格式：`主版本号.次版本号.修订号`

- **主版本号（MAJOR）**: 不兼容的 API 修改
- **次版本号（MINOR）**: 向下兼容的功能性新增
- **修订号（PATCH）**: 向下兼容的问题修正

### 版本号示例

- `1.0.0` - 初始发布版本
- `1.0.1` - 修复 bug
- `1.1.0` - 新增功能（向下兼容）
- `2.0.0` - 重大更新（可能不兼容）

## 当前版本

**v0.1.0** - 2025-11-28

### 版本历史

- **v0.1.0** (2025-11-28)
  - 项目初始化
  - 基础框架搭建
  - 核心业务逻辑实现

## 发布流程

### 1. 开发阶段
- 在 `develop` 分支进行开发
- 功能完成后合并到 `develop`

### 2. 测试阶段
- 在 `develop` 分支进行测试
- 修复发现的问题

### 3. 发布准备
- 从 `develop` 创建 `release/vX.Y.Z` 分支
- 更新版本号
- 更新 CHANGELOG.md
- 进行最终测试

### 4. 发布
- 合并 `release/vX.Y.Z` 到 `main` 分支
- 创建 Git Tag: `vX.Y.Z`
- 合并回 `develop` 分支

### 5. 发布后
- 在 GitHub 创建 Release
- 更新文档

## Git Tag 使用

```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0

# 查看所有标签
git tag -l

# 删除标签（本地）
git tag -d v1.0.0

# 删除标签（远程）
git push origin --delete v1.0.0
```

## 分支策略

- `main`: 生产环境代码，稳定版本
- `develop`: 开发分支，最新开发代码
- `feature/*`: 功能开发分支
- `fix/*`: Bug 修复分支
- `hotfix/*`: 紧急修复分支
- `release/*`: 发布准备分支

## 版本更新检查清单

- [ ] 更新 `package.json` 中的版本号
- [ ] 更新 `CHANGELOG.md`
- [ ] 更新 `VERSION.md`
- [ ] 运行测试确保通过
- [ ] 构建生产版本确保成功
- [ ] 创建 Git Tag
- [ ] 更新 Release Notes

