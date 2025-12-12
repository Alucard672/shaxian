#!/bin/bash

# 启动服务脚本
# 使用方法: ./启动服务.sh

echo "=========================================="
echo "  启动沙县ERP系统服务"
echo "=========================================="
echo ""

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo "❌ Java未找到，请先安装Java 17+"
    exit 1
fi

# 检查Maven是否安装
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven未找到，请先安装Maven"
    exit 1
fi

# 检查端口3000是否被占用
if lsof -i :3000 &> /dev/null; then
    echo "⚠️  端口3000已被占用"
    echo "正在检查是否是后端服务..."
    if curl -s http://localhost:3000/health &> /dev/null; then
        echo "✅ 后端服务已在运行"
        BACKEND_RUNNING=true
    else
        echo "❌ 端口被占用但不是后端服务，请检查"
        exit 1
    fi
else
    BACKEND_RUNNING=false
fi

# 启动后端服务
if [ "$BACKEND_RUNNING" = false ]; then
    echo ""
    echo "正在启动后端服务..."
    cd server-springboot
    
    # 检查是否已编译
    if [ ! -d "target" ] || [ ! -f "target/shaxian-api-1.0.0.jar" ]; then
        echo "正在编译项目..."
        mvn clean package -DskipTests
        if [ $? -ne 0 ]; then
            echo "❌ 编译失败"
            exit 1
        fi
    fi
    
    # 启动服务
    echo "启动Spring Boot服务..."
    nohup mvn spring-boot:run > /tmp/springboot.log 2>&1 &
    SPRING_PID=$!
    
    echo "后端服务启动中（PID: $SPRING_PID）..."
    echo "日志文件: /tmp/springboot.log"
    
    # 等待服务启动
    echo "等待服务启动..."
    for i in {1..30}; do
        sleep 2
        if curl -s http://localhost:3000/health &> /dev/null; then
            echo "✅ 后端服务启动成功！"
            echo "   健康检查: http://localhost:3000/health"
            echo "   API地址: http://localhost:3000/api"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ 服务启动超时，请检查日志: tail -f /tmp/springboot.log"
            exit 1
        fi
    done
fi

echo ""
echo "=========================================="
echo "  ✅ 服务启动完成"
echo "=========================================="
echo ""
echo "后端服务:"
echo "  状态: ✅ 运行中"
echo "  地址: http://localhost:3000"
echo "  健康检查: http://localhost:3000/health"
echo ""
echo "查看日志:"
echo "  tail -f /tmp/springboot.log"
echo ""
echo "停止服务:"
echo "  pkill -f 'spring-boot:run'"
echo ""


