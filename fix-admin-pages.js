const fs = require('fs');
const path = require('path');

const adminPages = [
  '/workspace/cei-platform/app/admin/hiring-fees/page.tsx',
  '/workspace/cei-platform/app/admin/interactions/page.tsx',
  '/workspace/cei-platform/app/admin/moderation/page.tsx',
  '/workspace/cei-platform/app/admin/users/page.tsx',
  '/workspace/cei-platform/app/admin/verifications/page.tsx',
];

const fallbackCode = `
// Check if Clerk keys are available
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback component for when Clerk is not configured
function ClerkFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center px-4">
        <div className="mb-6">
          <svg className="w-16 h-16 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400 mb-6">Authentication is being configured</p>
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-6 inline-block">
          <p className="text-amber-300 text-sm">
            Clerk authentication is not configured in this environment.
          </p>
        </div>
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline block">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
`;

adminPages.forEach(page => {
  if (fs.existsSync(page)) {
    const content = fs.readFileSync(page, 'utf8');
    
    // Add hasClerkKeys check if not present
    if (!content.includes('hasClerkKeys')) {
      // Find the last import line
      const lastImportMatch = content.match(/^import .+?\n/gm).pop();
      if (lastImportMatch) {
        const insertPosition = content.lastIndexOf(lastImportMatch) + lastImportMatch.length;
        const newContent = content.slice(0, insertPosition) + fallbackCode + content.slice(insertPosition);
        fs.writeFileSync(page, newContent);
        console.log(`Fixed: ${page}`);
      }
    }
    
    // Add fallback check in default function
    const defaultFuncMatch = content.match(/export default function (\w+)\(\) \{/);
    if (defaultFuncMatch) {
      const funcContent = content.substring(content.indexOf(defaultFuncMatch[0]));
      // Check if fallback is not inside
      if (!funcContent.includes('if (!hasClerkKeys)')) {
        // Add fallback check after opening brace
        const newFuncContent = funcContent.replace(
          'export default function ' + defaultFuncMatch[1] + '() {',
          'export default function ' + defaultFuncMatch[1] + '() {\n  if (!hasClerkKeys) {\n    return <ClerkFallback />;\n  }\n'
        );
        const newContent = content.replace(funcContent, newFuncContent);
        fs.writeFileSync(page, newContent);
        console.log(`Added fallback to: ${page}`);
      }
    }
  }
});

console.log('Done fixing admin pages');