# Pencil MCP 画图设置说明

你已安装 **Pencil** 扩展（`highagency.pencildev`）。要让 Cursor 的 AI 通过 MCP 调用 Pencil 帮你画图，按下面步骤操作。

## ⚠️ 重要提示

**不要手动编辑 `~/.cursor/mcp.json` 添加 Pencil 配置！** 扩展会在启动时检查设置项，如果设置项未启用，会自动删除手动添加的配置。

## 1. 启用 Pencil 的 Cursor MCP 集成（必须）

1. 打开 **Cursor 设置**：`Cmd + ,`（Mac）或 `Ctrl + ,`（Windows/Linux）
2. 在搜索框输入 **`Pencil`** 或 **`MCP`**
3. 找到 **「Pencil: Install MCP server to Cursor CLI」**（`pencil.mcp.integrations.cursorCLI`）
4. **勾选启用**该选项（默认是关闭的）

启用后，Pencil 扩展会：
- 启动内部的 WebSocket 服务器（自动分配端口）
- 自动把 MCP 配置写入 `~/.cursor/mcp.json`（包括正确的端口）
- **Cursor IDE 也使用这个文件**，所以不需要单独配置 Cursor CLI

## 2. 重启 Cursor（必须）

**完全退出并重新打开 Cursor**，让扩展：
- 读取你刚启用的设置项
- 启动 WebSocket 服务器
- 自动写入 MCP 配置到 `~/.cursor/mcp.json`

## 3. 确认 MCP 已加载

1. 打开 **Cursor 设置** → **Features** → **MCP**
2. 在 MCP 服务器列表中查看是否出现 **`pencil`**
3. 若没有，点击 **刷新**；若仍没有，检查：
   - 设置项 `pencil.mcp.integrations.cursorCLI` 是否已启用
   - 扩展是否正常运行（侧边栏是否有 Pencil 图标）
   - 查看 Cursor 的开发者工具控制台是否有错误

## 4. 使用方式

- 在 **Composer / Agent**（`Cmd + I` 或 `Ctrl + I`）里和 AI 对话
- 直接描述你想画的内容，例如：
  - “用 Pencil 画一个登录页的线框图”
  - “帮我画一个产品卡片的 UI 草图”
  - “画一个简单的流程图：用户注册 → 登录 → 首页”

AI 在需要画图时会调用 Pencil 的 MCP 工具，在 Pencil 画布上生成设计。你可以在侧边栏 **Pencil** 面板里查看和编辑。

## 5. 注意事项

- **Pencil 扩展需保持启用**：MCP 依赖扩展内建的 WebSocket 服务，禁用扩展后画图会不可用。
- **至少保持一个 Cursor 窗口打开**：扩展激活后才会启动相关服务。
- 若已按上面操作仍无法画图，可尝试 **完全退出 Cursor 再重新打开**，确保加载最新 MCP 配置。

## 6. 故障排查

### 问题：配置被自动删除

**原因**：设置项 `pencil.mcp.integrations.cursorCLI` 未启用。

**解决**：
1. 打开 Cursor 设置，搜索 `Pencil`
2. 启用 **「Pencil: Install MCP server to Cursor CLI」**
3. 完全重启 Cursor

### 问题：MCP 列表中有 pencil 但显示 "Loading tools"

**原因**：WebSocket 服务器可能未启动或端口不对。

**解决**：
1. 确保 Pencil 扩展已启用
2. 确保至少有一个 Cursor 窗口打开（扩展需要激活）
3. 查看 Cursor 的开发者工具（Help → Toggle Developer Tools）是否有错误

### 问题：手动添加配置后重启就没了

**原因**：扩展启动时会检查设置项，如果未启用会自动删除。

**解决**：**必须启用设置项**，让扩展自动管理配置，不要手动添加。

## 7. 手动检查配置（可选）

配置由 Pencil 自动写入，一般无需改。若要确认，可查看 `~/.cursor/mcp.json`，其中应包含类似：

```json
{
  "mcpServers": {
    "pencil": {
      "command": "/Users/你的用户名/.cursor/extensions/highagency.pencildev-0.6.9-universal/out/mcp-server-darwin-arm64",
      "args": ["--ws-port", "某个动态端口"],
      "env": {}
    }
  }
}
```

**请勿手动修改**：`command` 和 `args`（特别是端口）由扩展根据你的系统、扩展版本和当前会话动态生成。手动修改会导致连接失败。
