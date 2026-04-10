import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Component Lab',
  description:
    'Browse, inspect, edit, and build UI components visually. Export production-ready, type-safe .tsx files. Built with shadcn/ui.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {/* ── Mobile gate ─────────────────────────────────────── */}
        <div className="flex min-h-screen items-center justify-center p-8 text-center lg:hidden">
          <div className="max-w-sm space-y-3">
            <p className="text-lg font-semibold">Component Lab</p>
            <p className="text-sm text-muted-foreground">
              This app is designed for desktop screens. Please switch to a device with a screen width of at least 1024px.
            </p>
          </div>
        </div>
        {/* ── Main app (desktop only) ─────────────────────────── */}
        <div className="hidden lg:contents">
          {children}
        </div>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
