import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '奇门通玄针法 · 择时开穴',
  description: '基于奇门遁甲 + 通玄针法的择时开穴工具',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}