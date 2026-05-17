import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '議題探究小幫手',
  description: '幫助國中小老師輔導學生進行議題探究，發展適合的主題與子題',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
