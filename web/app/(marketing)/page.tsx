'use client';

import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Recognition from '@/components/landing/Recognition';
import ProblemSolution from '@/components/landing/ProblemSolution';
import ScreenshotGallery from '@/components/landing/ScreenshotGallery';
import RoleValue from '@/components/landing/RoleValue';
import PlatformCapabilities from '@/components/landing/PlatformCapabilities';
import HowItWorks from '@/components/landing/HowItWorks';
import DownloadApp from '@/components/landing/DownloadApp';
import InstitutionsCTA from '@/components/landing/InstitutionsCTA';
import Team from '@/components/landing/Team';
import MemoriesGallery from '@/components/landing/MemoriesGallery';
import FAQ from '@/components/landing/FAQ';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <main className="landing-page scroll-smooth">
      <LandingNav />
      <Hero />
      <Recognition />
      <ProblemSolution />
      <ScreenshotGallery />
      <RoleValue />
      <PlatformCapabilities />
      <HowItWorks />
      <DownloadApp />
      <InstitutionsCTA />
      <Team />
      <MemoriesGallery />
      <FAQ />
      <LandingFooter />
    </main>
  );
}
