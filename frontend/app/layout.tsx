import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "失物招领系统",
  description: "基于AI文本相似度匹配的失物招领平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <NavBar />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {children}
        </main>
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400 text-sm">
            失物招领系统 © 2026 | AI文本相似度匹配
          </div>
        </footer>
      </body>
    </html>
  );
}
