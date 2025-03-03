/* eslint-disable @next/next/no-page-custom-font */
// "use client"
import {
  ClerkProvider,

} from '@clerk/nextjs'
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './app.css';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Raven',
  description: 'Raven Beta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
         <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"/>
         <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Rubik+Vinyl&display=swap" rel="stylesheet"></link>
         <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@285&family=Rubik+Vinyl&display=swap" rel="stylesheet"></link>
        </head>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}