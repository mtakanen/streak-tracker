import { AppProps } from 'next/app';
import { ScopeProvider } from '@/context/ScopeContext';
import { Analytics } from "@vercel/analytics/react"

import '@/styles/globals.css';
import '@/styles/Skeleton.css'; // Add necessary CSS for skeleton loading

import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
      <ScopeProvider>
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Component {...pageProps} />
        <Analytics />
      </div>
      </ScopeProvider>
  );
}

export default MyApp;