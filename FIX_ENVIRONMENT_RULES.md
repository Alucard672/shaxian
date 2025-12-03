# 修复 GitHub Pages 环境保护规则问题

## 问题描述

错误信息：
- "Branch "master" is not allowed to deploy to github-pages due to environment protection rules."
- "The deployment was rejected or didn't satisfy other protection rules."

**原因**：`github-pages` 环境配置了保护规则，不允许 `master` 分支部署。

## 解决方案

### 方法 1：修改环境保护规则（推荐）

1. **访问环境设置**：
   - 打开：https://github.com/Alucard672/shaxian/settings/environments

2. **找到 github-pages 环境**：
   - 如果看到 "github-pages" 环境，点击它
   - 如果没有看到，先运行一次工作流，GitHub 会自动创建

3. **修改部署分支规则**：
   - 在 "Deployment branches" 部分
   - 选择 **"All branches"**（允许所有分支）
   - 或者选择 **"Selected branches"** 并添加 `master` 分支

4. **保存设置**

5. **重新运行工作流**：
   - 访问：https://github.com/Alucard672/shaxian/actions
   - 点击最新的失败运行
   - 点击右上角的 "Re-run jobs" > "Re-run all jobs"

### 方法 2：移除环境保护规则

如果 `github-pages` 环境有保护规则限制：

1. 访问：https://github.com/Alucard672/shaxian/settings/environments
2. 点击 `github-pages` 环境
3. 移除或修改以下保护规则：
   - **Required reviewers**（如果有）- 可以移除或添加自己为审核者
   - **Deployment branches** - 设置为 "All branches"
   - **Wait timer**（如果有）- 可以设置为 0 分钟
4. 保存设置

## 快速修复步骤

### 步骤 1：访问环境设置
```
https://github.com/Alucard672/shaxian/settings/environments
```

### 步骤 2：配置 github-pages 环境

如果环境不存在：
- 第一次运行工作流时会自动创建
- 或者手动创建：点击 "New environment"，名称输入 `github-pages`

如果环境已存在：
- 点击 `github-pages` 环境
- 在 "Deployment branches" 中选择 "All branches"
- 保存

### 步骤 3：重新运行工作流

1. 访问 Actions：https://github.com/Alucard672/shaxian/actions
2. 找到失败的工作流运行
3. 点击 "Re-run jobs" > "Re-run all jobs"

## 验证

部署成功后，你应该看到：

1. ✅ 工作流运行显示绿色 ✓
2. ✅ `build` 步骤成功
3. ✅ `deploy` 步骤成功
4. ✅ 可以访问：https://alucard672.github.io/shaxian/

## 注意事项

- 环境保护规则是为了安全性设置的
- 对于个人项目，通常不需要严格的保护规则
- 如果将来需要更严格的规则，可以在环境设置中重新配置

## 如果仍然有问题

如果修改环境设置后仍然失败，请：
1. 等待 1-2 分钟让设置生效
2. 重新运行工作流
3. 如果还是失败，检查是否有其他保护规则（如 Required reviewers）

