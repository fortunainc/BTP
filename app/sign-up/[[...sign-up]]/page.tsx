import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Join Behind the Protocol
          </h1>
          <p className="text-slate-400 text-lg">
            Create your anonymous professional profile
          </p>
        </div>
        
        {/* Info banner about sign-up */}
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-green-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-green-300">
              <p className="font-semibold mb-1">Quick Sign-up</p>
              <p className="text-green-400">Use your work email for faster verification.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl p-2">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 w-full bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-2 border-slate-600 hover:bg-slate-700/50",
                formButtonPrimary: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg",
                footerActionLink: "text-green-400 hover:text-green-300",
                identityPreview: "hidden",
                formFieldInput: "bg-slate-900 border-slate-700",
              }
            }}
            routing="path"
            path="/sign-up"
            fallbackRedirectUrl="/onboarding"
            signInUrl="/sign-in"
          />
        </div>
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Join thousands of clinical trial professionals sharing insights anonymously and finding opportunities</p>
        </div>
      </div>
    </div>
  );
}