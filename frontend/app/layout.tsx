import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppLayout from "@/components/AppLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xeno CRM",
  description: "AI-native mini CRM for reaching shoppers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-[#070709] text-gray-100 min-h-screen antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}