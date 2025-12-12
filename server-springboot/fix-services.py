#!/usr/bin/env python3
"""
批量移除 Service 中的 Lombok @RequiredArgsConstructor 注解
并添加手动构造函数
"""

import re
from pathlib import Path

SERVICE_DIR = Path("/Users/alucard/Documents/shaxian/server-springboot/src/main/java/com/shaxian/service")

def process_service(file_path):
    """处理单个 Service 文件"""
    print(f"处理: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否有 @RequiredArgsConstructor
    if '@RequiredArgsConstructor' not in content:
        print(f"  跳过 (没有 @RequiredArgsConstructor)")
        return False
    
    # 移除 Lombok 导入
    content = re.sub(r'import lombok\.RequiredArgsConstructor;\n', '', content)
    
    # 移除 @RequiredArgsConstructor 注解
    content = re.sub(r'@RequiredArgsConstructor\n', '', content)
    
    # 找到所有 private final 字段
    fields = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        if line.strip().startswith('private final '):
            # 提取类型和字段名
            match = re.search(r'private final\s+(\S+)\s+(\w+);', line)
            if match:
                field_type = match.group(1)
                field_name = match.group(2)
                fields.append((field_type, field_name))
    
    if not fields:
        print(f"  没有找到 final 字段")
        return False
    
    # 生成构造函数
    constructor_params = ',\n            '.join([f"{t} {n}" for t, n in fields])
    constructor_assignments = '\n        '.join([f"this.{n} = {n};" for _, n in fields])
    
    # 找到最后一个字段的位置
    last_field_line = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('private final '):
            last_field_line = i
    
    if last_field_line == -1:
        print(f"  错误: 找不到字段位置")
        return False
    
    # 在最后一个字段后插入构造函数
    constructor = f"""
    public {file_path.stem}(
            {constructor_params}) {{
        {constructor_assignments}
    }}
"""
    
    lines.insert(last_field_line + 1, constructor)
    
    new_content = '\n'.join(lines)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✓ 已添加构造函数 ({len(fields)} 个参数)")
    return True

def main():
    """主函数"""
    print("开始批量处理 Service...")
    print(f"目录: {SERVICE_DIR}\n")
    
    processed = 0
    skipped = 0
    
    for java_file in SERVICE_DIR.glob("*Service.java"):
        if process_service(java_file):
            processed += 1
        else:
            skipped += 1
    
    print(f"\n完成!")
    print(f"处理: {processed} 个文件")
    print(f"跳过: {skipped} 个文件")

if __name__ == "__main__":
    main()
