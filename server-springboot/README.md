# 沙县ERP系统 - Spring Boot 后端

这是沙县ERP系统的 Spring Boot 版本后端服务。

## 技术栈

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL
- Maven

## 快速开始

1. 确保已安装 JDK 17 和 Maven
2. 创建数据库 `shaxian_erp` 并执行 `database/schema.sql`
3. 配置 `src/main/resources/application.yml` 中的数据库连接
4. 运行 `mvn spring-boot:run`

详细说明请查看 [启动说明.md](./启动说明.md)

## API 文档

所有 API 端点以 `/api` 开头，详见启动说明文档。

## 项目状态

当前版本已实现基础框架和部分核心功能，更多功能正在开发中。

