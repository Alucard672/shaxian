#!/usr/bin/env python3
"""
批量移除控制器中的 Lombok @RequiredArgsConstructor 注解
并添加手动构造函数
"""

import re
from pathlib import Path

CONTROLLER_DIR = Path("/Users/alucard/Documents/shaxian/server-springboot/src/main/java/com/shaxian/controller")

def process_controller(file_path):
    """处理单个控制器文件"""
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
    
    # 找到类定义后的第一个字段位置
    class_line = -1
    first_field_line = -1
    
    for i, line in enumerate(lines):
        if 'public class' in line:
            class_line = i
        if class_line != -1 and line.strip().startswith('private final '):
            first_field_line = i
            break
    
    if first_field_line == -1:
        print(f"  错误: 找不到字段位置")
        return False
    
    # 找到最后一个字段的位置
    last_field_line = first_field_line
    for i in range(first_field_line + 1, len(lines)):
        if lines[i].strip().startswith('private final '):
            last_field_line = i
        elif lines[i].strip() and not lines[i].strip().startswith('//'):
            break
    
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
    print("开始批量处理控制器...")
    print(f"目录: {CONTROLLER_DIR}\n")
    
    processed = 0
    skipped = 0
    
    for java_file in CONTROLLER_DIR.glob("*Controller.java"):
        if java_file.name == "InventoryController.java":
            print(f"跳过: {java_file.name} (已手动处理)")
            skipped += 1
            continue
            
        if process_controller(java_file):
            processed += 1
        else:
            skipped += 1
    
    print(f"\n完成!")
    print(f"处理: {processed} 个文件")
    print(f"跳过: {skipped} 个文件")

if __name__ == "__main__":
    main()
