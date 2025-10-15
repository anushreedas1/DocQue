import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "@/contexts/ApiContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knowledge Base Search Engine",
  description: "Search across your documents with AI-powered answers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <GlobalErrorBoundary>
          <ApiProvider>
            {children}
          </ApiProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
