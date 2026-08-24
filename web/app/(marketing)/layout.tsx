/**
 * Marketing layout — dedicated layout for landing/public pages
 * Separate from the authenticated dashboard shell
 */

import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Kavach — School Disaster Preparedness | SIH 2025 First Prize',
  description:
    'AI-powered school safety platform — IoT sensing, drill management, learning modules, and real-time alerts. Smart India Hackathon 2025 National Award, First Prize.',
  keywords: [
    'Kavach',
    'school safety',
    'disaster preparedness',
    'SIH 2025',
    'Smart India Hackathon',
    'IoT school',
    'NDMA',
    'school drills',
    'AI safety',
  ],
  icons: {
    icon: '/kavach-logo.jpeg',
    apple: '/kavach-logo.jpeg',
  },
  openGraph: {
    title: 'Kavach — School Disaster Preparedness | SIH 2025 First Prize',
    description:
      'AI-powered school safety platform — IoT sensing, drill management, learning modules, and real-time alerts.',
    type: 'website',
    siteName: 'Kavach',
    images: [{ url: '/kavach-logo.jpeg', width: 512, height: 512, alt: 'Kavach Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kavach — School Disaster Preparedness',
    description:
      'SIH 2025 First Prize. AI + IoT + drills + parent alerts for schools.',
    images: ['/kavach-logo.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${dmSans.variable} landing-root`}
    >
      {children}
    </div>
  );
}
