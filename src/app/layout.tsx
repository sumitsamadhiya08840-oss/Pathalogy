import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "NXA Pathology Lab - Staff Panel",
  description: "A comprehensive pathology lab management system built with Next.js and Material UI",
  icons: {
    icon: "/favicon.ico",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeRegistry>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
