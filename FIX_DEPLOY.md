# GitHub Pages 部署问题修复指南

## 快速检查清单

### ✅ 第一步：检查 GitHub Pages 设置

1. **访问仓库设置**：
   - https://github.com/Alucard672/shaxian/settings/pages

2. **配置 Source**：
   - 在 "Source" 下拉菜单中选择 **"GitHub Actions"**
   - 不要选择分支（如 master 或 gh-pages）
   - 点击 "Save"

### ✅ 第二步：检查 Actions 权限

1. **访问 Actions 设置**：
   - https://github.com/Alucard672/shaxian/settings/actions

2. **确认权限**：
   - 确保 "Actions permissions" 设置为 **"Allow all actions and reusable workflows"**
   - 或者至少允许本地 Actions 工作流

### ✅ 第三步：查看具体错误

1. **访问 Actions 页面**：
   - https://github.com/Alucard672/shaxian/actions

2. **查看失败的工作流**：
   - 点击失败的运行（红色 X）
   - 展开失败的步骤（通常是 "Build" 或 "Deploy"）
   - **复制错误信息**

## 常见错误及快速修复

### ❌ 错误：Environment "github-pages" not found

**原因**：GitHub Pages 环境未创建

**解决方法**：
1. 访问：https://github.com/Alucard672/shaxian/settings/environments
2. 如果看到 "github-pages" 环境，跳过此步
3. 如果没有，点击 **"New environment"**
4. 名称输入：`github-pages`
5. 保存

**或者**：直接重新运行工作流，GitHub 会自动创建环境

### ❌ 错误：Permission denied 或 403 Forbidden

**原因**：权限不足

**解决方法**：
1. 确保在 Settings > Pages 中已选择 "GitHub Actions" 作为 Source
2. 确保工作流文件 `.github/workflows/deploy.yml` 已提交
3. 等待 1-2 分钟后重新运行工作流

### ❌ 错误：Build failed（构建失败）

**原因**：TypeScript 或构建错误

**解决方法**：
1. 在本地运行 `npm run build` 确保可以成功构建
2. 如果本地构建失败，修复错误后再推送
3. 查看 Actions 日志中的具体 TypeScript 错误

### ❌ 错误：404 或页面无法访问

**原因**：URL 路径不正确

**解决方法**：
- 确保访问：`https://alucard672.github.io/shaxian/`
- 注意 URL 末尾有斜杠 `/`
- 等待几分钟让部署生效

## 手动触发部署

如果自动部署失败，可以手动触发：

1. 访问：https://github.com/Alucard672/shaxian/actions
2. 在左侧选择 **"Deploy to GitHub Pages"** 工作流
3. 点击右上角的 **"Run workflow"** 按钮
4. 选择 `master` 分支
5. 点击 **"Run workflow"**

## 验证部署成功

1. ✅ 工作流运行显示绿色 ✓
2. ✅ 所有步骤都显示成功
3. ✅ 访问 https://alucard672.github.io/shaxian/ 可以看到应用

## 需要帮助？

如果仍然失败，请提供：

1. **错误截图** 或
2. **错误日志**（从 Actions 页面复制）
3. **失败的步骤名称**

这样我可以更准确地帮你解决问题！

## 当前配置检查

✅ 工作流文件：`.github/workflows/deploy.yml` 已配置
✅ Base 路径：`vite.config.ts` 中设置为 `/shaxian/`
✅ Router basename：`src/App.tsx` 中设置为 `/shaxian`
✅ 构建成功：本地 `npm run build` 可以成功

## 下一步

1. 按照上面的检查清单操作
2. 查看具体的错误信息
3. 根据错误信息应用相应的修复方法

