# 自动化测试说明

## 测试内容

本测试套件用于测试租户登录流程，包括：

1. **后端服务健康检查** - 验证后端服务是否正常运行
2. **默认密码登录测试** - 使用默认密码123456登录
3. **错误密码测试** - 验证错误密码被正确拒绝
4. **不存在用户测试** - 验证不存在的用户被正确拒绝
5. **空参数测试** - 验证空参数被正确拒绝

## 运行测试

### 前置条件

1. **启动后端服务**
   ```bash
   cd server-springboot
   mvn spring-boot:run
   ```
   
   等待服务启动完成（通常需要10-30秒），直到看到类似以下输出：
   ```
   Started ShaxianApiApplication in X.XXX seconds
   ```

2. **确保数据库已配置**
   - MySQL服务已启动
   - 数据库 `shaxian_erp` 已创建
   - 已执行 `database/schema.sql` 创建表结构
   - 已执行 `database/migration_add_password.sql` 添加password字段
   - 已执行 `server-springboot/src/main/resources/data.sql` 初始化数据（包含默认管理员账号）

### 运行测试

```bash
# 运行登录流程测试
npm run test:auth

# 或直接运行
npm test
```

### 使用自定义API地址

```bash
API_BASE_URL=http://localhost:3000/api npm run test:auth
```

## 测试账号

默认测试账号：
- **手机号**: `13800138000`
- **密码**: `123456`

## 预期结果

所有测试应该通过，输出类似：

```
============================================================
🚀 开始运行租户登录流程自动化测试
============================================================
API地址: http://localhost:3000/api
测试时间: 2025/12/12 16:50:38

🧪 测试: 测试5: 后端服务健康检查
  ✅ 后端服务正常运行
     时间戳: 2025-12-12T16:50:38.488336

🧪 测试: 测试1: 使用默认密码123456登录
  ✅ 登录成功
  ✅ 用户信息返回正确
     用户ID: emp-admin-001
     用户名: 系统管理员
     手机号: 13800138000

🧪 测试: 测试2: 使用错误密码登录
  ✅ 错误密码被正确拒绝

🧪 测试: 测试3: 使用不存在的手机号登录
  ✅ 不存在的用户被正确拒绝

🧪 测试: 测试4: 使用空参数登录
  ✅ 空参数被正确拒绝

============================================================
📊 测试结果总结
============================================================
总测试数: 5
通过: 5
失败: 0

============================================================
✅ 所有测试通过！
```

## 故障排查

### 后端服务无法连接

**问题**: `无法连接到后端服务`

**解决方案**:
1. 检查后端服务是否启动：
   ```bash
   lsof -i :3000
   ```
2. 检查后端服务日志：
   ```bash
   tail -f /tmp/springboot-test.log
   ```
3. 手动启动后端服务：
   ```bash
   cd server-springboot
   mvn spring-boot:run
   ```

### 登录失败

**问题**: `登录失败` 或 `用户不存在`

**解决方案**:
1. 确保数据库已初始化：
   ```bash
   # 执行数据初始化脚本
   mysql -u root -p shaxian_erp < server-springboot/src/main/resources/data.sql
   ```
2. 检查数据库中是否存在测试账号：
   ```sql
   SELECT * FROM employees WHERE phone = '13800138000';
   ```
3. 如果不存在，手动创建测试账号：
   ```sql
   INSERT INTO employees (id, name, phone, role, password, status, created_at, updated_at) 
   VALUES ('emp-admin-001', '系统管理员', '13800138000', 'role-boss', '123456', 'active', NOW(), NOW());
   ```

### 数据库连接错误

**问题**: 后端启动时出现数据库连接错误

**解决方案**:
1. 检查MySQL服务是否运行：
   ```bash
   # macOS
   brew services list | grep mysql
   
   # Linux
   systemctl status mysql
   ```
2. 检查数据库配置 (`server-springboot/src/main/resources/application.yml`):
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/shaxian_erp
       username: root
       password: your_password
   ```

## 测试文件结构

```
test/
├── README.md           # 本文件
└── auth-flow.test.js   # 登录流程测试脚本
```

## 扩展测试

要添加新的测试用例，编辑 `test/auth-flow.test.js` 文件，添加新的测试函数并在 `runTests()` 中调用。

示例：
```javascript
async function testNewFeature() {
  logTest('测试X: 新功能测试');
  // 测试代码
  logPass('测试通过');
}
```


