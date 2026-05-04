import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-lg">
            Sign in to your account
          </p>
        </div>
        
        {/* Info banner about sign-in */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Sign-in Options</p>
              <p className="text-blue-400">Use email/password for quickest access.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl p-2">
          <SignIn 
            appearance={{
              baseTheme: undefined,
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 w-full bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-2 border-slate-600 hover:bg-slate-700/50",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                identityPreview: "hidden",
                formFieldInput: "bg-slate-900 border-slate-700",
              }
            }}
            routing="path"
            path="/sign-in"
            fallbackRedirectUrl="/situations"
            signUpUrl="/sign-up"
          />
        </div>
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Join thousands of clinical trial professionals sharing insights and finding opportunities</p>
        </div>
      </div>
    </div>
  );
}