import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AppProviders } from '@/components/providers/app-providers'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
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

