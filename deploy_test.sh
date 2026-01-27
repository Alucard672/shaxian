#!/bin/bash

ip=120.27.148.45
user=root

set -euo pipefail

npm install
npm run build

# 使用 SSH Key 免密发布：
# 1) 本机生成 key：ssh-keygen -t ed25519 -C "shaxian-deploy"
# 2) 将公钥写入服务器：ssh-copy-id root@120.27.148.45
# 3) 之后执行本脚本即可免密部署
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
if [ ! -f "$SSH_KEY_PATH" ]; then
  echo "未找到 SSH 私钥：$SSH_KEY_PATH"
  echo "请先执行：ssh-keygen -t ed25519 -C \"shaxian-deploy\""
  exit 1
fi

SSH_OPTS="-i $SSH_KEY_PATH -o BatchMode=yes -o StrictHostKeyChecking=accept-new"

rsync -av --checksum --delete -e "ssh $SSH_OPTS" ./dist/ $user@$ip:/web/deploy/shaxian-sales

ssh $SSH_OPTS $user@$ip "chown -R nginx:nginx /web/deploy/shaxian-sales"

echo "部署成功"