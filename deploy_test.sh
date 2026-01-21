#!/bin/bash

ip=120.27.148.45
user=root

npm install
npm run build

rsync -av --checksum --delete ./dist/ $user@$ip:/web/deploy/shaxian-sales

ssh $user@$ip "chown -R nginx:nginx /web/deploy/shaxian-sales"

echo "部署成功"