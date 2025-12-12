# GitHub Pages 部署设置指南

## 重要：首次部署前必须完成的设置

### 1. 启用 GitHub Pages

在仓库设置中启用 GitHub Pages：

1. 访问：https://github.com/Alucard672/shaxian/settings/pages
2. 在 **Source** 部分，选择 **GitHub Actions**（不是分支）
3. 保存设置

### 2. 检查 Actions 权限

1. 访问：https://github.com/Alucard672/shaxian/settings/actions
2. 在 **Actions permissions** 部分，确保：
   - ✅ **Allow all actions and reusable workflows** 已选择
   - 或者至少允许本地 Actions 工作流运行

### 3. 检查工作流文件

确保 `.github/workflows/deploy.yml` 文件存在且已提交到仓库。

### 4. 查看错误日志

如果工作流失败，请：

1. 访问：https://github.com/Alucard672/shaxian/actions
2. 点击失败的工作流运行（红色 X）
3. 查看详细的错误信息
4. 展开失败的步骤，查看具体错误

## 常见错误及解决方案

### 错误 1：Environment "github-pages" not found

**解决方案**：
- 首次运行工作流时，GitHub 会自动创建 `github-pages` 环境
- 如果出现此错误，可能需要手动创建：
  1. 访问：https://github.com/Alucard672/shaxian/settings/environments
  2. 点击 **New environment**
  3. 名称填写：`github-pages`
  4. 保存

### 错误 2：Permission denied

**解决方案**：
- 确保在仓库设置中已启用 GitHub Pages
- 确保工作流有正确的权限（已配置在 `.github/workflows/deploy.yml`）

### 错误 3：Build failed

**解决方案**：
- 检查本地是否能成功构建：`npm run build`
- 查看 Actions 日志中的构建错误
- 确保所有依赖都已提交（package-lock.json）

### 错误 4：404 Not Found（部署成功但页面无法访问）

**解决方案**：
- 确保访问的 URL 正确：`https://alucard672.github.io/shaxian/`
- 注意 URL 末尾的斜杠 `/`
- 检查 `vite.config.ts` 中的 `base` 路径是否正确

## 验证部署是否成功

1. 访问 Actions：https://github.com/Alucard672/shaxian/actions
2. 找到最新的工作流运行
3. 应该看到绿色的 ✓ 标记
4. 访问网站：https://alucard672.github.io/shaxian/

## 如果仍然失败

请提供以下信息：

1. 错误截图或错误日志
2. 失败的步骤名称
3. 具体的错误消息

这样我可以更准确地帮助你解决问题。







