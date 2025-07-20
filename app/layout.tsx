import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TruthCheck AI - Agentic AI Verifier',
  description: 'An agentic AI verifier that detects hallucinations, misinformation, and logical errors across AI-generated content.',
  generator: 'TruthCheck AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
