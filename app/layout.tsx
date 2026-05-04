import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from "@/components/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BehindTheProtocol - Where Clinical Trial Operators Tell the Truth",
  description: "Anonymous operational intelligence network for clinical trial operators. Get real answers, share experiences, and navigate the field safely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // In production build without env vars, render without Clerk
  if (!publishableKey) {
    return (
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/situations"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <AuthProvider>
        <html lang="en" className="dark">
          <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
            {children}
          </body>
        </html>
      </AuthProvider>
    </ClerkProvider>
  );
}