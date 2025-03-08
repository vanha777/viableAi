import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/react"
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { AppProvider } from './utils/AppContext';
config.autoAddCss = false
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ConvictionAI - Build Founder Conviction Before Code',
  description: 'ConvictionAI is an AI-driven platform designed to help founders and entrepreneurs build conviction around their ideas through validation.',
  openGraph: {
    title: 'ConvictionAI - Build Founder Conviction Before Code',
    description: 'ConvictionAI is an AI-driven platform designed to help founders and entrepreneurs build conviction around their ideas through validation.',
    // url: 'https://www.convictionai.com/',
    images: [
      {
        url: 'https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg',
        alt: 'ConvictionAI - Build Founder Conviction Before Code',
      },
    ],
  },
  icons: {
    icon: '/logo.png',
    // You can also specify different sizes
    apple: [
      { url: '/logo.png' },
      { url: '/apple.png', sizes: '180x180' }
    ],
    shortcut: '/favicon.ico'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <Head>
        {/* General Meta Tags */}
        <meta name="title" content="ConvictionAI - Build Founder Conviction Before Code" />
        <meta name="description" content="ConvictionAI is an AI-driven platform designed to help founders and entrepreneurs build conviction around their ideas through validation." />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.convictionai.com/" />
        <meta property="og:title" content="ConvictionAI - Build Founder Conviction Before Code" />
        <meta property="og:description" content="AI-driven platform to help founders build conviction around their ideas through validation." />
        <meta property="og:image" content="https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg" />
        <meta property="og:image:alt" content="ConvictionAI platform preview" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.convictionai.com/" />
        <meta name="twitter:title" content="ConvictionAI - Build Founder Conviction Before Code" />
        <meta name="twitter:description" content="AI-driven platform to help founders build conviction around their ideas through validation." />
        <meta name="twitter:image" content="https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg" />
        <meta name="twitter:image:alt" content="ConvictionAI platform preview" />
        <meta name="twitter:site" content="@convictionai" />
        <meta name="twitter:creator" content="@convictionai" />

        {/* Telegram */}
        <meta property="og:title" content="ConvictionAI - Build Founder Conviction Before Code" />
        <meta property="og:description" content="AI-driven platform to help founders build conviction around their ideas through validation." />
        <meta property="og:image" content="https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg" />
        <meta property="og:url" content="https://www.convictionai.com/" />

        {/* Discord */}
        <meta property="og:title" content="ConvictionAI - Build Founder Conviction Before Code" />
        <meta property="og:description" content="AI-driven platform to help founders build conviction around their ideas through validation." />
        <meta property="og:image" content="https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg" />
        <meta property="og:type" content="website" />
      </Head>
      <body suppressHydrationWarning={true} className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
} 