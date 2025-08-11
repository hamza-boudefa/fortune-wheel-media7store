import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const now = new Date()
  const tunisianTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Tunis" }))
  const currentHour = tunisianTime.getHours()
  const isAccessible = currentHour >= 8 || currentHour === 0
  if (!isAccessible) {
    return <div className="text-center text-white bg-red-700 h-screen flex items-center justify-center tracking-tight text-3xl font-bold text-white mb-2">L'application n'est accessible qu'entre 8h00 et 00h00. Veuillez réessayer plus tard.</div>
  }
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
