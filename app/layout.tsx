import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Template',
  description: 'Built with Next.js, shadcn/ui, Tailwind CSS, and Supabase.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
