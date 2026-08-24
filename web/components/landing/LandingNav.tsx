'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS, SITE } from '@/lib/content/landing';
import { KavachLogo } from '@/components/branding/KavachLogo';
import { Menu, X, Download, LogIn, ArrowRight } from 'lucide-react';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setPastHero(window.scrollY > window.innerHeight - 80);

      // Scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? window.scrollY / docHeight : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navStyle = pastHero
    ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]'
    : scrolled
      ? 'bg-[#050b18]/85 backdrop-blur-xl border-b border-white/[0.07]'
      : 'bg-transparent border-b border-transparent';

  const textStyle = pastHero
    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]';
  const brandColor = pastHero ? 'text-slate-900' : 'text-white';

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navStyle}`}>
        <div className="landing-container flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <KavachLogo slot="nav" />
            <span className={`font-display font-bold text-xl tracking-tight transition-colors ${brandColor}`}>
              Kavach
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-lg ${textStyle}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2.5">
            <a
              href={SITE.loginUrl}
              className={`px-4 py-2 text-sm font-semibold transition-all rounded-lg ${
                pastHero
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Login
            </a>
            <a
              href="#download"
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-500 hover:to-emerald-500 transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Download
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${pastHero ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-slate-100 shadow-xl"
            >
              <div className="landing-container py-5 flex flex-col gap-1">
                <div className="flex items-center gap-2.5 px-4 pb-4 mb-2 border-b border-slate-100">
                  <KavachLogo slot="mobileMenu" />
                  <span className="font-display font-bold text-lg text-slate-900">Kavach</span>
                </div>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                  <a href={SITE.loginUrl} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50">
                    <LogIn className="w-4 h-4" />Login
                  </a>
                  <a href="#download" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-md">
                    <Download className="w-4 h-4" />Download APK
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
