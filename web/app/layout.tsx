import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AppProviders } from '@/components/providers/app-providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Kavach',
    template: '%s · Kavach',
  },
  description: 'Disaster Preparedness & Response Education System',
  icons: {
    icon: '/kavach-logo.jpeg',
    apple: '/kavach-logo.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            <AppProviders>
              <a href="#main-content" className="skip-to-main">
                Skip to main content
              </a>
              {children}
            </AppProviders>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

