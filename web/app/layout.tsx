import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduSafe - Admin Dashboard',
  description: 'Disaster Preparedness & Response Education System',
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
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

