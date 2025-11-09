import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sudoku Teacher - Learn While You Play',
  description: 'An intelligent Sudoku app that teaches you strategies as you play',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
