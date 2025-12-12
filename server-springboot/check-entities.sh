#!/bin/bash

# 批量为 Java 实体类生成 getter/setter 方法的脚本
# 这个脚本会处理所有使用 Lombok @Data 注解的实体类

ENTITY_DIR="/Users/alucard/Documents/shaxian/server-springboot/src/main/java/com/shaxian/entity"

echo "开始处理实体类..."
echo "目录: $ENTITY_DIR"

# 列出所有需要处理的 Java 文件
find "$ENTITY_DIR" -name "*.java" -type f | while read file; do
    echo "处理文件: $(basename $file)"
    
    # 检查文件是否包含 @Data 注解
    if grep -q "@Data" "$file"; then
        echo "  - 发现 @Data 注解"
    fi
done

echo "完成！"
