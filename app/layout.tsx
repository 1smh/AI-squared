import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: "AI² - AI without the negatives, because it's squared",
  description: 'An agentic AI verifier that detects hallucinations, misinformation, and logical errors across AI-generated content.',
  generator: 'AI²',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
