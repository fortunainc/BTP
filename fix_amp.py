import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace &amp;&amp; with &&
    content = content.replace('&amp;&amp;', '&&')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

# Find all .tsx and .ts files in app directory
count = 0
for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            fix_file(filepath)
            count += 1

print(f"Fixed {count} files")