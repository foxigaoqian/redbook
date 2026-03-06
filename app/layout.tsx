import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI 小红书笔记复刻器 - 爆款内容矩阵生成工具',
  description: '一键抓取小红书笔记并复刻生成多个变体版本，支持文案与图片生成。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
