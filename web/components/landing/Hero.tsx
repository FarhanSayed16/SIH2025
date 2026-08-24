'use client';

import { motion } from 'framer-motion';
import { HERO, SITE } from '@/lib/content/landing';
import { Download, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { BrowserShot, PhoneShot } from './ProductShot';
import { IndiaFlagMark } from './IndiaFlagMark';

const rise = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-[var(--k-night)] k-noise"
    >
      <style>{`
        @keyframes slowPan {
          0% { transform: scale(1.02) translate(0px, 0px); }
          50% { transform: scale(1.08) translate(-1%, 1%); }
          100% { transform: scale(1.02) translate(0px, 0px); }
        }
        @keyframes f1 {
          0%, 20% { opacity: 1; }
          25%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes f2 {
          0%, 20% { opacity: 0; }
          25%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes f3 {
          0%, 45% { opacity: 0; }
          50%, 70% { opacity: 1; }
          75%, 100% { opacity: 0; }
        }
        @keyframes f4 {
          0%, 70% { opacity: 0; }
          75%, 95% { opacity: 1; }
          100% { opacity: 0; }
        }
        .bg-img-1 { animation: f1 32s infinite, slowPan 30s infinite ease-in-out; }
        .bg-img-2 { animation: f2 32s infinite, slowPan 35s infinite ease-in-out reverse; }
        .bg-img-3 { animation: f3 32s infinite, slowPan 32s infinite ease-in-out; }
        .bg-img-4 { animation: f4 32s infinite, slowPan 37s infinite ease-in-out reverse; }
      `}</style>

      {/* Cinematic Background Container */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--k-night)]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-img-1"
          style={{ backgroundImage: "url('/hero-bg-1.png')" }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-img-2"
          style={{ backgroundImage: "url('/hero-bg-2.png')" }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-img-3"
          style={{ backgroundImage: "url('/hero-bg-3.png')" }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-img-4"
          style={{ backgroundImage: "url('/hero-bg-4.png')" }}
        />
      </div>
      
      {/* Proper Blue Filter */}
      <div className="absolute inset-0 z-0 bg-[#0a1628]/50 mix-blend-multiply" />
      
      {/* Bottom Fade to blend into the next section */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--k-night)] via-[var(--k-night)]/80 to-transparent" />
      
      {/* Subtle blueprint grid and aurora */}
      <div className="k-hero-blueprint k-grid-faint-dark opacity-15 z-0" />
      <div className="k-hero-aurora z-0" />

      <motion.div
        initial="hidden"
        animate="visible"
        className="landing-container landing-container-wide relative z-10 w-full pb-16 pt-24 md:pb-20 md:pt-28"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
          {/* ---------- Copy column ---------- */}
          <div className="k-hero-copy">
            <motion.p variants={rise} custom={0} className="k-hero-kicker">
              <IndiaFlagMark className="k-hero-kicker-flag" />
              <span className="k-hero-kicker-prize">{HERO.kickerPrize}</span>
              <span className="k-hero-kicker-sep" aria-hidden="true" />
              <span>{HERO.kickerEvent}</span>
            </motion.p>

            <motion.h1 variants={rise} custom={1} className="k-hero-h1">
              {HERO.headlineLead}
              <span className="k-hero-h1-follow">{HERO.headlineFollow}</span>
            </motion.h1>

            <motion.p variants={rise} custom={2} className="k-hero-support">
              {HERO.support}
            </motion.p>

            <motion.div variants={rise} custom={3} className="k-hero-actions">
              <a href="#download" className="k-hero-cta k-hero-cta-primary">
                <Download className="h-4 w-4" />
                {HERO.ctaPrimary}
              </a>
              <a href={SITE.loginUrl} className="k-hero-cta k-hero-cta-ghost">
                {HERO.ctaSecondary}
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.ul variants={rise} custom={4} className="k-hero-proof">
              {HERO.proof.map((item) => (
                <li key={item}>
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-teal-400" strokeWidth={2.75} />
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* ---------- Device cluster ---------- */}
          <div className="group relative hidden lg:block">
            <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_60%_40%,rgba(20,184,166,0.16),transparent_65%)] blur-2xl" />

            <div className="relative pb-10">
              <motion.div variants={rise} custom={3} className="k-hero-panel">
                <BrowserShot slot="heroDashboard" bodyRatio="1600 / 898" />
              </motion.div>

              <motion.div
                variants={rise}
                custom={5}
                className="absolute -bottom-12 -left-12 w-[160px] drop-shadow-[0_25px_45px_rgba(2,6,23,0.75)]"
              >
                <PhoneShot slot="heroPhone" />
              </motion.div>

              <motion.div
                variants={rise}
                custom={6}
                className="absolute -bottom-5 right-3 rounded-2xl border border-white/10 bg-[#050b18]/85 px-4 py-3 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">One system</p>
                </div>
                <p className="mt-1.5 text-[12.5px] font-medium text-white/70">
                  Web console · Android app · IoT nodes
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <a
        href="#recognition"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/25 transition-colors hover:text-white/60 md:flex"
        aria-label="Scroll to recognition"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Explore</span>
        <ChevronDown className="h-4 w-4 transition-transform duration-300 hover:translate-y-0.5" />
      </a>

      {/* Institutional seam into the page body */}
      <div className="k-tricolour-rule absolute bottom-0 left-0 right-0 z-10 opacity-80" />
    </section>
  );
}
