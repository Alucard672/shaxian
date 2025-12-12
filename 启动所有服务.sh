#!/bin/bash

# 启动所有服务脚本
# 使用方法: ./启动所有服务.sh

echo "=========================================="
echo "  启动沙县ERP系统所有服务"
echo "=========================================="
echo ""

# 检查后端服务
echo "检查后端服务..."
if curl -s http://localhost:3000/health &> /dev/null; then
    echo "✅ 后端服务已在运行"
    BACKEND_RUNNING=true
else
    echo "⚠️  后端服务未运行，正在启动..."
    BACKEND_RUNNING=false
    
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
    
    # 等待服务启动
    for i in {1..30}; do
        sleep 2
        if curl -s http://localhost:3000/health &> /dev/null; then
            echo "✅ 后端服务启动成功！"
            BACKEND_RUNNING=true
            break
        fi
    done
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "❌ 后端服务启动超时，请检查日志: tail -f /tmp/springboot.log"
        exit 1
    fi
    
    cd ..
fi

# 检查前端服务
echo ""
echo "检查前端服务..."
FRONTEND_PORT=""
for port in 5173 5174 5175; do
    if lsof -i :$port &> /dev/null; then
        FRONTEND_PORT=$port
        echo "✅ 前端服务已在运行 (端口: $port)"
        break
    fi
done

if [ -z "$FRONTEND_PORT" ]; then
    echo "⚠️  前端服务未运行，正在启动..."
    
    # 检查Node.js
    if ! command -v npm &> /dev/null; then
        echo "❌ npm未找到，请先安装Node.js"
        exit 1
    fi
    
    # 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        echo "正在安装依赖..."
        npm install
    fi
    
    # 启动前端服务
    echo "启动前端服务..."
    npm run dev > /tmp/vite.log 2>&1 &
    VITE_PID=$!
    
    echo "前端服务启动中（PID: $VITE_PID）..."
    echo "等待服务启动..."
    
    # 等待服务启动
    for i in {1..20}; do
        sleep 2
        for port in 5173 5174 5175; do
            if lsof -i :$port &> /dev/null; then
                FRONTEND_PORT=$port
                echo "✅ 前端服务启动成功！(端口: $port)"
                break 2
            fi
        done
    done
    
    if [ -z "$FRONTEND_PORT" ]; then
        echo "❌ 前端服务启动超时，请检查日志: tail -f /tmp/vite.log"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "  ✅ 所有服务启动完成"
echo "=========================================="
echo ""
echo "后端服务:"
echo "  状态: ✅ 运行中"
echo "  地址: http://localhost:3000"
echo "  健康检查: http://localhost:3000/health"
echo "  API地址: http://localhost:3000/api"
echo ""
echo "前端服务:"
echo "  状态: ✅ 运行中"
echo "  地址: http://localhost:$FRONTEND_PORT/shaxian/"
echo ""
echo "查看日志:"
echo "  后端: tail -f /tmp/springboot.log"
echo "  前端: tail -f /tmp/vite.log"
echo ""
echo "停止服务:"
echo "  后端: pkill -f 'spring-boot:run'"
echo "  前端: pkill -f 'vite'"
echo ""


