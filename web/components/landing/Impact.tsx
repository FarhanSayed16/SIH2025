'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMPACT, IMPACT_INTRO } from '@/lib/content/landing';
import { ClipboardCheck, Radio, GraduationCap, Heart, LayoutDashboard } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const icons = [ClipboardCheck, Radio, GraduationCap, Heart, LayoutDashboard];

// Map each impact to a rich image from the gallery
const impactImages = [
  { src: '/gallery/mobile/student-4.jpg', type: 'mobile' }, // Higher drill readiness
  { src: '/gallery/mobile/student-8.jpg', type: 'mobile' }, // Faster awareness
  { src: '/gallery/mobile/student-2.jpg', type: 'mobile' }, // Better learning retention
  { src: '/gallery/mobile/parent-1.jpg', type: 'mobile' },  // Parent peace of mind
  { src: '/gallery/web/admin-16.png', type: 'web' },        // Admin visibility
];

export default function Impact() {
  const [activeTab, setActiveTab] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play the tabs every 4 seconds unless hovered
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % IMPACT.length);
    }, 4500);
    
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section id="impact" className="landing-section k-night-band k-noise relative overflow-hidden">
      <div className="k-tricolour-rule absolute left-0 right-0 top-0 z-10" />
      <div className="k-grid-faint k-grid-faint-dark" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="k-section-head mb-14 max-w-2xl">
          <p className="k-tag k-tag-dark">Impact</p>
          <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white">
            {IMPACT_INTRO.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-400">{IMPACT_INTRO.subtitle}</p>
        </motion.div>

        {/* The Tabbed Showcase Board */}
        <motion.div 
          variants={fadeUp} 
          custom={2} 
          className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Column: The Tabs */}
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[26rem]">
            {IMPACT.map((item, i) => {
              const Icon = icons[i];
              const isActive = activeTab === i;
              
              return (
                <button
                  key={item.theme}
                  onClick={() => setActiveTab(i)}
                  className={`group relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${
                    isActive 
                      ? 'border-teal-500/40 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.15)]' 
                      : 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                  }`}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <div>
                    <h3 className={`font-display text-[1rem] font-bold tracking-tight transition-colors ${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'
                    }`}>
                      {item.theme}
                    </h3>
                  </div>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute -left-px bottom-0 top-0 w-1 rounded-l-xl bg-teal-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: The Display Window */}
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-1 shadow-2xl backdrop-blur-md">
            {/* Window Chrome */}
            <div className="flex h-10 items-center gap-2 border-b border-slate-700/50 bg-slate-800/40 px-4">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            {/* Display Area */}
            <div className="relative flex h-[400px] w-full flex-col bg-slate-900 lg:h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col p-8"
                >
                  <div className="mb-6 max-w-lg">
                    <h3 className="mb-3 font-display text-2xl font-bold text-white">
                      {IMPACT[activeTab].theme}
                    </h3>
                    <p className="text-[1rem] leading-relaxed text-slate-300">
                      {IMPACT[activeTab].support}
                    </p>
                  </div>

                  {/* Dynamic Image Display */}
                  <div className="relative flex flex-1 items-center justify-center">
                    {impactImages[activeTab].type === 'mobile' ? (
                      <div className="relative aspect-[1220/2712] h-[340px] overflow-hidden rounded-3xl border-4 border-slate-700/80 bg-black shadow-2xl">
                        {/* Notch */}
                        <div className="absolute left-1/2 top-0 z-10 h-[10px] w-[35%] -translate-x-1/2 rounded-b-[6px] bg-slate-700/80" />
                        <img 
                          src={impactImages[activeTab].src} 
                          alt={IMPACT[activeTab].theme}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="relative w-[90%] overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-2xl">
                        <img 
                          src={impactImages[activeTab].src} 
                          alt={IMPACT[activeTab].theme}
                          className="w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} custom={3} className="mt-12 text-center text-[0.875rem] font-medium tracking-wide text-teal-500/70">
          Every outcome maps to something the school can measure.
        </motion.p>
      </motion.div>
    </section>
  );
}
