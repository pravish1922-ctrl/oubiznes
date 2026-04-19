import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OuBiznes.mu — Free tools for Mauritian businesses',
  description: 'Find every SME grant, track every MRA deadline, calculate VAT and PAYE. Free AI-powered tools for Mauritian businesses.',
  openGraph: {
    title: 'OuBiznes.mu',
    description: 'Free tools for Mauritian businesses',
    locale: 'en_MU',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
