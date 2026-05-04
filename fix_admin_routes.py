#!/usr/bin/env python3
"""
Fix admin API routes:
1. Missing id extraction from URL path
2. Wrong variable name (request -> req)  
3. Wrong property name (user.role -> user.userRole)
"""

import re
import os

BASE = "/workspace/cei-platform"

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content)
    print(f"  FIXED: {path}")

# =============================================
# Fix 1: admin/fee-records/[id]/route.ts
# =============================================
print("Fix 1: admin/fee-records/[id]/route.ts")
path = f"{BASE}/app/api/admin/fee-records/[id]/route.ts"
content = read_file(path)

# Replace: const { id: feeRecordId } = id;
# With URL extraction
content = content.replace(
    "const { id: feeRecordId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const feeRecordId = pathSegments[4]; // /api/admin/fee-records/[id]"
)

# Replace: request.json() -> req.json()
content = content.replace("await request.json()", "await req.json()")

write_file(path, content)

# =============================================
# Fix 2: admin/flagged-content/[id]/dismiss/route.ts
# =============================================
print("Fix 2: admin/flagged-content/[id]/dismiss/route.ts")
path = f"{BASE}/app/api/admin/flagged-content/[id]/dismiss/route.ts"
content = read_file(path)

content = content.replace(
    "const { id: flagId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const flagId = pathSegments[4]; // /api/admin/flagged-content/[id]/dismiss"
)

# Fix user.role -> user.userRole
content = content.replace("user.role !== 'admin'", "user.userRole !== 'admin'")

write_file(path, content)

# =============================================
# Fix 3: admin/flagged-content/[id]/remove/route.ts
# =============================================
print("Fix 3: admin/flagged-content/[id]/remove/route.ts")
path = f"{BASE}/app/api/admin/flagged-content/[id]/remove/route.ts"
content = read_file(path)

content = content.replace(
    "const { id: flagId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const flagId = pathSegments[4]; // /api/admin/flagged-content/[id]/remove"
)

write_file(path, content)

# =============================================
# Fix 4: admin/users/[id]/status/route.ts
# =============================================
print("Fix 4: admin/users/[id]/status/route.ts")
path = f"{BASE}/app/api/admin/users/[id]/status/route.ts"
content = read_file(path)

content = content.replace(
    "const { id: userId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const userId = pathSegments[4]; // /api/admin/users/[id]/status"
)

# Fix user.role -> user.userRole
content = content.replace("user.role !== 'admin'", "user.userRole !== 'admin'")

# Replace: request.json() -> req.json()
content = content.replace("await request.json()", "await req.json()")

write_file(path, content)

# =============================================
# Fix 5: admin/verifications/[id]/approve/route.ts
# =============================================
print("Fix 5: admin/verifications/[id]/approve/route.ts")
path = f"{BASE}/app/api/admin/verifications/[id]/approve/route.ts"
content = read_file(path)

content = content.replace(
    "const { id: userId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const userId = pathSegments[4]; // /api/admin/verifications/[id]/approve"
)

# Fix user.role -> user.userRole
content = content.replace("user.role !== 'admin'", "user.userRole !== 'admin'")

write_file(path, content)

# =============================================
# Fix 6: admin/verifications/[id]/reject/route.ts
# =============================================
print("Fix 6: admin/verifications/[id]/reject/route.ts")
path = f"{BASE}/app/api/admin/verifications/[id]/reject/route.ts"
content = read_file(path)

content = content.replace(
    "const { id: userId } = id;",
    "// Extract ID from URL path\n      const url = new URL(req.url);\n      const pathSegments = url.pathname.split('/');\n      const userId = pathSegments[4]; // /api/admin/verifications/[id]/reject"
)

# Fix user.role -> user.userRole
content = content.replace("user.role !== 'admin'", "user.userRole !== 'admin'")

# Replace: request.json() -> req.json()
content = content.replace("await request.json()", "await req.json()")

write_file(path, content)

# =============================================
# Fix 7: admin/audit-logs/route.ts
# =============================================
print("Fix 7: admin/audit-logs/route.ts")
path = f"{BASE}/app/api/admin/audit-logs/route.ts"
content = read_file(path)

# Fix: request.url -> req.url
content = content.replace("new URL(request.url)", "new URL(req.url)")

# Fix user.role -> user.userRole
content = content.replace("user.role !== 'admin'", "user.userRole !== 'admin'")

write_file(path, content)

print("\n============================================")
print("All admin route fixes applied.")
print("============================================")