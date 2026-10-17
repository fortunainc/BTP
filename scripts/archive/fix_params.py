import os
import re

def fix_route_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: { params }: { params: { id: string } }
    # Change to: { params }: { params: Promise<{ id: string }> }
    pattern1 = r'\{ params \}: \{ params: \{ ([^}]+) \} \}'
    replacement1 = r'{ params }: { params: Promise<{ \1 }> }'
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: const { id } = params;
    # Change to: const { id } = await params;
    pattern2 = r'const \{ id \} = params;'
    replacement2 = r'const { id } = await params;'
    content = re.sub(pattern2, replacement2, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all route.ts files with dynamic routes
count = 0
for root, dirs, files in os.walk('app/api'):
    for file in files:
        if file == 'route.ts' and '[' in root:
            filepath = os.path.join(root, file)
            if fix_route_file(filepath):
                count += 1
                print(f"Fixed: {filepath}")

print(f"Fixed {count} files")