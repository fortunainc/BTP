import os
import re

def fix_route_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern: const feeRecordId = params.id;
    # Change to: const { id: feeRecordId } = await params;
    pattern = r'const\s+(\w+)\s*=\s*params\.id;'
    replacement = r'const { id: \1 } = await params;'
    content = re.sub(pattern, replacement, content)
    
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