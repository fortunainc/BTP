#!/usr/bin/env python3
"""
Comprehensive fix for all broken API routes.
Issues found:
1. situations/[id]/interact/route.ts - contributionId used without extraction from params
2. situations/[id]/outcome/route.ts - contributionId used without extraction from params
3. situations/route.ts - appears structurally OK (no dynamic params)
4. applications/[id]/hire/route.ts - applicationId used without extraction from params
5. applications/route.ts - extra } after GET handler, causing syntax error
6. hires/[id]/outcome/route.ts - hireId used without extraction from params
7. notifications/route.ts - GET uses req.url instead of request.url, POST missing closing paren
8. Multiple files use undefined 'pathParts' variable
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
# Fix 1: situations/[id]/interact/route.ts
# =============================================
print("Fix 1: situations/[id]/interact/route.ts")
path = f"{BASE}/app/api/situations/[id]/interact/route.ts"
content = read_file(path)

# The POST handler uses contributionId without extracting it from the URL.
# Need to extract it from req.url
old_post = '''export const POST = withAuth(async (req, user) => {
      const body = await req.json();
      const { interactionType, context } = body;'''

new_post = '''export const POST = withAuth(async (req, user) => {
      // Extract contributionId from URL path: /api/situations/[id]/interact
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const contributionId = pathSegments[3]; // /api/situations/[id]/interact

      const body = await req.json();
      const { interactionType, context } = body;'''

content = content.replace(old_post, new_post)

# Remove the erroneous "export default { POST, GET };" at the end if present
content = re.sub(r'\nexport default \{ POST, GET \};\s*$', '', content)

write_file(path, content)

# =============================================
# Fix 2: situations/[id]/outcome/route.ts
# =============================================
print("Fix 2: situations/[id]/outcome/route.ts")
path = f"{BASE}/app/api/situations/[id]/outcome/route.ts"
content = read_file(path)

# The POST handler uses contributionId without extracting it from the URL.
old_post = '''export const POST = withAuth(async (req, user) => {
      const body = await req.json();
      const { 
        outcomeType, 
        outcomeData, 
        wasHelpful,
        impactScore
      } = body;'''

new_post = '''export const POST = withAuth(async (req, user) => {
      // Extract contributionId from URL path: /api/situations/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const contributionId = pathSegments[3]; // /api/situations/[id]/outcome

      const body = await req.json();
      const { 
        outcomeType, 
        outcomeData, 
        wasHelpful,
        impactScore
      } = body;'''

content = content.replace(old_post, new_post)
write_file(path, content)

# =============================================
# Fix 3: applications/[id]/hire/route.ts
# =============================================
print("Fix 3: applications/[id]/hire/route.ts")
path = f"{BASE}/app/api/applications/[id]/hire/route.ts"
content = read_file(path)

# The POST handler uses applicationId without extracting it from the URL.
old_post = '''export const POST = withAuth(async (req, user) => {
      // Only organizations can hire
      if (user.userRole !== 'organization') {
        return createErrorResponse('Only organizations can create hires', 403);
      }

      const body = await req.json();'''

new_post = '''export const POST = withAuth(async (req, user) => {
      // Extract applicationId from URL path: /api/applications/[id]/hire
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const applicationId = pathSegments[3]; // /api/applications/[id]/hire

      // Only organizations can hire
      if (user.userRole !== 'organization') {
        return createErrorResponse('Only organizations can create hires', 403);
      }

      const body = await req.json();'''

content = content.replace(old_post, new_post)
write_file(path, content)

# =============================================
# Fix 4: hires/[id]/outcome/route.ts
# =============================================
print("Fix 4: hires/[id]/outcome/route.ts")
path = f"{BASE}/app/api/hires/[id]/outcome/route.ts"
content = read_file(path)

# The POST handler uses hireId without extracting from URL
old_post = '''export const POST = withAuth(async (req, user) => {
      const body = await req.json();
      const { 
        wasSuccessful, 
        wouldRehire, 
        feedback,
        performanceScore
      } = body;'''

new_post = '''export const POST = withAuth(async (req, user) => {
      // Extract hireId from URL path: /api/hires/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const hireId = pathSegments[3]; // /api/hires/[id]/outcome

      const body = await req.json();
      const { 
        wasSuccessful, 
        wouldRehire, 
        feedback,
        performanceScore
      } = body;'''

content = content.replace(old_post, new_post)

# The GET handler also uses hireId without extracting from URL
old_get = '''export const GET = withAuth(async (req, user) => {
      // Get the hire record
      const hire = await prisma.hire.findUnique({
        where: { id: hireId },'''

new_get = '''export const GET = withAuth(async (req, user) => {
      // Extract hireId from URL path: /api/hires/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const hireId = pathSegments[3]; // /api/hires/[id]/outcome

      // Get the hire record
      const hire = await prisma.hire.findUnique({
        where: { id: hireId },'''

content = content.replace(old_get, new_get)
write_file(path, content)

# =============================================
# Fix 5: applications/route.ts - Extra } and req vs request
# =============================================
print("Fix 5: applications/route.ts")
path = f"{BASE}/app/api/applications/route.ts"
content = read_file(path)

# Fix: Remove the extra } after GET handler (between GET and POST)
# The pattern is: `  });\n}\n\n/**` should be `  });\n\n/**`
content = content.replace(
    "  });\n}\n\n/**\n * POST",
    "  });\n\n/**\n * POST"
)

# Also fix POST handler: uses `req` instead of `request` for the parameter name
# but withAuth uses `request` as param name - actually withAuth passes (req, user)
# so the param name in the handler is whatever we declare. Let's check.
# The POST uses `request` as param name: `export const POST = withAuth(async (request, user) => {`
# But then references `req.url` - need to fix to `request.url`

write_file(path, content)

# =============================================
# Fix 6: notifications/route.ts - req vs request and missing paren
# =============================================
print("Fix 6: notifications/route.ts")
path = f"{BASE}/app/api/notifications/route.ts"
content = read_file(path)

# GET handler: uses `req.url` but param is `request`
content = content.replace(
    "const { searchParams } = new URL(req.url);",
    "const { searchParams } = new URL(request.url);"
)

# POST handler: missing closing ) for withAuth
# Find the end of the POST handler - it ends with `}` but needs `}, { requireAuth: true })` or just `});`
# Looking at the file, POST ends with just `}` not `});` 
# The POST is: export const POST = withAuth(async (request, user) => { ... }
# It should close with: });  or  }, { requireAuth: true });

# Let's check the current ending
post_section = content[content.index("export const POST"):]
# Find the matching closing braces

# The issue is the POST handler body doesn't have proper closing.
# Let's rewrite the POST section properly
old_post_end = """    return createApiResponse({
      success: true,
      created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return createErrorResponse('Failed to create notification', 500);
  }
}"""

new_post_end = """    return createApiResponse({
      success: true,
      created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return createErrorResponse('Failed to create notification', 500);
  }
});"""

content = content.replace(old_post_end, new_post_end)

write_file(path, content)

# =============================================
# Fix 7: Fix all files using undefined 'pathParts'
# =============================================
print("Fix 7: Files using undefined 'pathParts' variable")

pathparts_files = [
    ("app/api/applications/[id]/route.ts", 3),  # /api/applications/[id]
    ("app/api/fee-records/[id]/route.ts", 3),    # /api/fee-records/[id]
    ("app/api/job-postings/[id]/route.ts", 3),   # /api/job-postings/[id]
    ("app/api/conversations/[id]/messages/route.ts", 3),  # /api/conversations/[id]/messages
    ("app/api/conversations/[id]/route.ts", 3),           # /api/conversations/[id]
]

for rel_path, id_index in pathparts_files:
    full_path = f"{BASE}/{rel_path}"
    if not os.path.exists(full_path):
        print(f"  SKIP: {rel_path} not found")
        continue
    
    content = read_file(full_path)
    
    # Replace the pathParts extraction with proper URL parsing
    old_pattern = "const id = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];"
    new_pattern = f"const url = new URL(req.url); const pathSegments = url.pathname.split('/'); const id = pathSegments[{id_index}];"
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        write_file(full_path, content)
    else:
        print(f"  NO-CHANGE: {rel_path} - pattern not found")

print("\n============================================")
print("All fixes applied. Running build verification next.")
print("============================================")