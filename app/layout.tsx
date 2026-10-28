import type { Metadata } from "next";
import { Inter, Newsreader, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from "@/components/AuthContext";

// Clerk-backed member and founder surfaces require request-time auth context.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });
const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], variable: "--font-newsreader", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: "500", style: "italic", variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  title: "BTP | Clinical trial experience, connected.",
  description: "Practical peer experience and private help for clinical research professionals. Ask questions, learn from peers, and follow up on what helped.",
  metadataBase: new URL("https://btp-rho-seven.vercel.app"),
  openGraph: {
    title: "BTP | Clinical trial experience, connected.",
    description: "Practical peer experience and private help for clinical research professionals. Invitation-only beta.",
    siteName: "Behind the Protocol",
    type: "website",
  },
  twitter: { card: "summary", title: "BTP | Clinical trial experience, connected." },
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
      <html lang="en" className={`dark ${newsreader.variable} ${cormorant.variable}`}>
        <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl="/__clerk"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/situations"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <AuthProvider>
        <html lang="en" className={`dark ${newsreader.variable} ${cormorant.variable}`}>
          <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
            {children}
          </body>
        </html>
      </AuthProvider>
    </ClerkProvider>
  );
}
