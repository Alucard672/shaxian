# GitHub Pages 部署故障排查指南

## 常见问题及解决方案

### 1. 工作流失败：权限问题

**症状**：工作流在部署步骤失败，提示权限不足

**解决方案**：
- 确保在仓库设置中已启用 GitHub Pages
- 在 Settings > Pages 中，Source 选择 "GitHub Actions"
- 工作流已包含必要的权限设置（`pages: write`, `id-token: write`）

### 2. 工作流失败：环境未配置

**症状**：工作流提示找不到 `github-pages` 环境

**解决方案**：
- 访问仓库 Settings > Environments
- 创建名为 `github-pages` 的环境（如果不存在）
- 或者让 GitHub 自动创建（首次部署时会自动创建）

### 3. 工作流失败：构建失败

**症状**：构建步骤失败

**检查清单**：
- 确认本地 `npm run build` 可以成功运行
- 检查 package-lock.json 是否已提交
- 查看 Actions 日志中的具体错误信息

### 4. 部署成功但页面无法访问

**症状**：工作流显示成功，但访问网站显示 404

**解决方案**：
- 检查 vite.config.ts 中的 `base` 路径是否正确（应为 `/shaxian/`）
- 检查 App.tsx 中 BrowserRouter 的 `basename` 是否正确
- 确保访问的 URL 是：`https://alucard672.github.io/shaxian/`

### 5. 手动触发部署

如果自动部署失败，可以手动触发：

1. 访问仓库的 Actions 页面
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 "Run workflow" 按钮
4. 选择 `master` 分支并运行

## 检查步骤

1. ✅ **检查仓库设置**
   - Settings > Pages > Source 设置为 "GitHub Actions"

2. ✅ **检查工作流文件**
   - `.github/workflows/deploy.yml` 已存在且配置正确

3. ✅ **检查构建配置**
   - `vite.config.ts` 中 `base: '/shaxian/'`
   - `src/App.tsx` 中 `BrowserRouter basename="/shaxian"`

4. ✅ **查看 Actions 日志**
   - 访问：https://github.com/Alucard672/shaxian/actions
   - 查看失败的工作流运行详情

## 如果问题仍然存在

1. 查看详细的错误日志
2. 检查 GitHub 服务状态：https://www.githubstatus.com/
3. 尝试手动触发工作流运行
4. 如果构建失败，检查 TypeScript 和 ESLint 错误

## 成功部署的标志

- ✅ 工作流运行状态显示绿色的 ✓
- ✅ 可以看到 "Deploy to GitHub Pages" 步骤成功完成
- ✅ 访问 https://alucard672.github.io/shaxian/ 可以看到应用


