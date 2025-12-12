#!/usr/bin/env python3
"""
自动为 Java 实体类生成 getter/setter 方法
移除 Lombok @Data 注解
"""

import re
import os
from pathlib import Path

ENTITY_DIR = Path("/Users/alucard/Documents/shaxian/server-springboot/src/main/java/com/shaxian/entity")

def parse_field(line):
    """解析字段定义，返回 (type, name)"""
    # 匹配: private Type fieldName;
    match = re.search(r'private\s+(\S+(?:<[^>]+>)?)\s+(\w+)\s*[=;]', line)
    if match:
        return match.group(1), match.group(2)
    return None, None

def generate_getter(field_type, field_name):
    """生成 getter 方法"""
    method_name = f"get{field_name[0].upper()}{field_name[1:]}"
    if field_type == "boolean" or field_type == "Boolean":
        method_name = f"is{field_name[0].upper()}{field_name[1:]}"
    
    return f"""
    public {field_type} {method_name}() {{
        return {field_name};
    }}
"""

def generate_setter(field_type, field_name):
    """生成 setter 方法"""
    method_name = f"set{field_name[0].upper()}{field_name[1:]}"
    return f"""
    public void {method_name}({field_type} {field_name}) {{
        this.{field_name} = {field_name};
    }}
"""

def process_entity_file(file_path):
    """处理单个实体类文件"""
    print(f"处理: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否有 @Data 注解
    if '@Data' not in content:
        print(f"  跳过 (没有 @Data 注解)")
        return False
    
    # 移除 Lombok 相关导入和注解
    content = re.sub(r'import lombok\.Data;\n', '', content)
    content = re.sub(r'import lombok\..*;\n', '', content)
    content = re.sub(r'@Data\n', '', content)
    
    # 解析所有字段
    fields = []
    lines = content.split('\n')
    in_class = False
    
    for line in lines:
        if 'public class' in line or 'public enum' in line:
            in_class = True
            continue
        
        if in_class and line.strip().startswith('private '):
            field_type, field_name = parse_field(line)
            if field_type and field_name:
                # 跳过已经有 @Transient 或特殊字段
                if '@Transient' not in line and field_name not in ['serialVersionUID']:
                    fields.append((field_type, field_name))
    
    if not fields:
        print(f"  没有找到字段")
        return False
    
    # 生成 getter/setter 方法
    methods = ["\n    // Getters and Setters\n"]
    for field_type, field_name in fields:
        methods.append(generate_getter(field_type, field_name))
        methods.append(generate_setter(field_type, field_name))
    
    # 找到类的最后一个 }，但要确保不是内部枚举或内部类的 }
    # 简单方法：找到文件末尾最后一个非空行的 }
    lines = content.split('\n')
    last_brace_line = -1
    for i in range(len(lines) - 1, -1, -1):
        stripped = lines[i].strip()
        if stripped == '}':
            last_brace_line = i
            break
    
    if last_brace_line == -1:
        print(f"  错误: 找不到类结束符")
        return False
    
    # 在最后一个 } 之前插入方法
    lines.insert(last_brace_line, ''.join(methods))
    new_content = '\n'.join(lines)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✓ 已生成 {len(fields)} 个字段的 getter/setter")
    return True

def main():
    """主函数"""
    print("开始批量处理实体类...")
    print(f"目录: {ENTITY_DIR}\n")
    
    processed = 0
    skipped = 0
    
    for java_file in ENTITY_DIR.glob("*.java"):
        if process_entity_file(java_file):
            processed += 1
        else:
            skipped += 1
    
    print(f"\n完成!")
    print(f"处理: {processed} 个文件")
    print(f"跳过: {skipped} 个文件")

if __name__ == "__main__":
    main()
