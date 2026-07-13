import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                📦 失物招领
              </Link>
              <div className="flex space-x-6">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  首页
                </Link>
                <Link
                  href="/post"
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  发布
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  我的
                </Link>
                <Link
                  href="/notifications"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  通知
                </Link>
                <Link
                  href="/match"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  AI匹配
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8 flex-1">
          {children}
        </main>
        <footer className="bg-white border-t mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
            失物招领系统 © 2026 | AI文本相似度匹配
          </div>
        </footer>
      </body>
    </html>
  );
}