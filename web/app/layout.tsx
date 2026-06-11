import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RnS SuDoCoach - Learn Sudoku with Your Coach!',
  description: 'Color-coded Sudoku learning app for kids. Green means fill me, red means oops!',
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
