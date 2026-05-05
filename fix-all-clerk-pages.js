const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all pages using Clerk hooks
const result = execSync(
  'grep -r "useAuth\\|useUser\\|useSignIn\\|useSignUp" app/ --include="*.tsx" -l',
  { cwd: '/workspace/cei-platform', encoding: 'utf-8' }
);
const pages = result.trim().split('\n').filter(p => p);

console.log(`Found ${pages.length} pages with Clerk hooks`);

const fallbackCode = `
// Check if Clerk keys are available
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback component for when Clerk is not configured
function ClerkFallback({ title = 'Authentication Required' }) {
  const router = require('next/navigation').useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center px-4">
        <div className="mb-6">
          <svg className="w-16 h-16 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 mb-6">Authentication is being configured</p>
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-6 inline-block">
          <p className="text-amber-300 text-sm">
            Clerk authentication is not configured in this environment.
          </p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
`;

let fixedCount = 0;

pages.forEach(pagePath => {
  const fullPath = path.join('/workspace/cei-platform', pagePath);
  
  if (!fs.existsSync(fullPath)) return;
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Skip if already has fallback
  if (content.includes('hasClerkKeys')) return;
  
  // Check if it's a client component using Clerk
  if (!content.includes('\'use client\'') && !content.includes('"use client"')) {
    console.log(`Skipping (server component): ${pagePath}`);
    return;
  }
  
  // Find import section and add fallback
  const importsEndMatch = content.match(/^import .+?\n/g);
  if (!importsEndMatch) return;
  
  const lastImport = importsEndMatch[importsEndMatch.length - 1];
  const insertIndex = content.indexOf(lastImport) + lastImport.length;
  
  const newContent = content.slice(0, insertIndex) + fallbackCode + content.slice(insertIndex);
  
  // Find default function and add fallback check
  const funcMatch = newContent.match(/export default (function|async function|const) (\w+)(\(\)| \{)/);
  if (!funcMatch) return; // Skip pages that aren't functional components
  
  // Find the opening brace of the function
  const funcStart = newContent.indexOf(funcMatch[0]);
  const openBrace = newContent.indexOf('{', funcStart);
  
  if (openBrace === -1) return;
  
  // Insert fallback check after opening brace
  const beforeFunc = newContent.slice(0, openBrace + 1);
  const afterFunc = newContent.slice(openBrace + 1);
  
  const finalContent = beforeFunc + '\n  if (!hasClerkKeys) {\n    return <ClerkFallback />;\n  }\n' + afterFunc;
  
  fs.writeFileSync(fullPath, finalContent);
  console.log(`Fixed: ${pagePath}`);
  fixedCount++;
});

console.log(`\nFixed ${fixedCount} pages`);