import os
import re

def fix_audit_log_calls(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern: logAuditEvent({ ... action: 'XXX', entityType: 'YYY', entityId: zzz, details: {...} })
    # Change to: logAuditEvent({ eventType: 'XXX' as any, ... resourceType: 'YYY', resourceId: zzz, metadata: {...} })
    pattern = r'(logAuditEvent\(\{[^}]*)(action:)([^}]+)(entityType:)([^}]+)(entityId:)([^}]+)(details:)([^}]+\}))'
    
    def replacement(match):
        prefix = match.group(1)
        action_value = match.group(3).strip()
        entity_type_value = match.group(5).strip()
        entity_id_value = match.group(7).strip()
        details_value = match.group(9).strip()
        suffix = match.group(10)
        
        # Extract the action value
        action_match = re.search(r"'([^']+)'", action_value)
        if action_match:
            action_value = action_match.group(1)
        
        # Extract the entity type value
        entity_type_match = re.search(r"'([^']+)'", entity_type_value)
        if entity_type_match:
            entity_type_value = entity_type_match.group(1)
        
        # Extract the entity id variable name
        entity_id_var = entity_id_value.strip().rstrip(',')
        
        # Fix details to metadata
        metadata_value = details_value.replace('details:', 'metadata:').strip()
        
        result = f"{prefix}eventType: '{action_value}' as any, resourceType: '{entity_type_value}', resourceId: {entity_id_var}, {metadata_value}{suffix}"
        return result
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all route.ts files
count = 0
for root, dirs, files in os.walk('app/api'):
    for file in files:
        if file == 'route.ts':
            filepath = os.path.join(root, file)
            if fix_audit_log_calls(filepath):
                count += 1
                print(f"Fixed: {filepath}")

print(f"Fixed {count} files")