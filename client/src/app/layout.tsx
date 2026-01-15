import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";


const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "DealGuard - AI Contract Intelligence",
  description: "AI-powered contract analysis and risk assessment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <AuthProvider>
          <ReactQueryProvider>
            {children}
            <Analytics />
          </ReactQueryProvider>

        </AuthProvider>
      </body>
    </html>
  );
}
