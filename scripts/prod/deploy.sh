#!/bin/bash
# ================================================================
# 前端 → 生产环境 部署
# 用法: cd shaxian && bash scripts/prod/deploy.sh
# ================================================================

set -euo pipefail

# -------- 配置 --------
SERVER_IP="${PROD_IP:-112.124.109.7}"
SERVER_USER="${PROD_USER:-root}"
DEPLOY_DIR=/web/deploy/shaxian-sales
# ----------------------

# SSH 连接
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
if [ -f "$SSH_KEY_PATH" ]; then
    SSH_OPTS="-i $SSH_KEY_PATH -o StrictHostKeyChecking=accept-new"
    echo "使用 SSH Key 连接"
else
    echo "未找到 SSH Key，将使用密码连接"
    echo "提示: 建议执行 ssh-copy-id ${SERVER_USER}@${SERVER_IP} 配置免密登录"
    SSH_OPTS="-o StrictHostKeyChecking=accept-new"
fi

echo "=========================================="
echo " 纱线ERP 前端 → 生产环境"
echo " 目标: ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}"
echo "=========================================="

# [1/3] 安装依赖
echo ""
echo "[1/3] 安装依赖..."
npm ci

# [2/3] 构建（Vite 自动读取 .env.production）
echo ""
echo "[2/3] 构建生产版本..."
npm run build

if [ ! -d "dist" ]; then
    echo "错误: 构建失败，dist 目录不存在"
    exit 1
fi
echo "构建完成: $(du -sh dist | awk '{print $1}')"

# [3/3] 上传
echo ""
echo "[3/3] 上传到服务器..."
rsync -av --checksum --delete -e "ssh $SSH_OPTS" ./dist/ $SERVER_USER@$SERVER_IP:$DEPLOY_DIR
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "chown -R nginx:nginx $DEPLOY_DIR"

echo ""
echo "=========================================="
echo " 生产环境前端部署成功！"
echo "=========================================="
