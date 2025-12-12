# GitHub Pages 部署指南

本项目已配置 GitHub Pages 静态托管，可以让远程同事访问测试。

## 部署步骤

### 1. 启用 GitHub Pages

1. 进入 GitHub 仓库：https://github.com/Alucard672/shaxian
2. 点击 **Settings** (设置)
3. 在左侧菜单找到 **Pages** (页面)
4. 在 **Source** (源) 部分：
   - 选择 **GitHub Actions** 作为部署源
5. 点击 **Save** (保存)

### 2. 自动部署

当推送代码到 `master` 分支时，GitHub Actions 会自动：
- 构建项目
- 部署到 GitHub Pages

### 3. 访问地址

部署成功后，可以通过以下地址访问：
```
https://alucard672.github.io/shaxian/
```

### 4. 查看部署状态

1. 进入仓库的 **Actions** 标签页
2. 查看最新的工作流运行状态
3. 等待部署完成（通常需要 2-3 分钟）

## 手动触发部署

如果需要手动触发部署：

1. 进入仓库的 **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 按钮
4. 选择分支（master）并运行

## 注意事项

1. **首次部署**：首次启用 GitHub Pages 可能需要几分钟时间
2. **访问路径**：所有路由路径会自动添加 `/shaxian/` 前缀
3. **数据存储**：项目使用 localStorage 存储数据，不同浏览器之间数据不共享
4. **HTTPS**：GitHub Pages 自动使用 HTTPS 协议

## 测试建议

远程同事可以：
1. 访问部署地址进行功能测试
2. 使用浏览器的开发者工具查看控制台错误
3. 测试各个功能模块是否符合需求

## 更新代码

每次推送代码到 master 分支后：
- 等待 2-3 分钟让 GitHub Actions 完成构建和部署
- 刷新页面即可看到最新版本

## 故障排查

如果部署失败：
1. 检查 Actions 日志查看错误信息
2. 确认 Node.js 版本兼容性（项目使用 Node 18）
3. 检查构建输出是否有错误







