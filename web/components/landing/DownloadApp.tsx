'use client';

import { motion } from 'framer-motion';
import { DOWNLOAD, SITE } from '@/lib/content/landing';
import { Download, Info, Apple, Monitor } from 'lucide-react';
import { PhoneShot } from './ProductShot';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const steps = [
  { label: 'Download', desc: 'Get the APK' },
  { label: 'Install', desc: 'Allow this source' },
  { label: 'Connect', desc: 'Link to your school' },
];

const phones = [
  { slot: 'downloadLogin' as const, label: 'Sign in' },
  { slot: 'downloadHome' as const, label: 'Student home', featured: true },
  { slot: 'downloadParent' as const, label: 'Parent view' },
];

export default function DownloadApp() {
  return (
    <section id="download" className="landing-section k-night-band k-noise relative overflow-hidden">
      <div className="k-grid-faint k-grid-faint-dark" />

      <div className="landing-container relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="k-download-layout"
        >
          <motion.div variants={fadeUp} custom={0} className="k-download-showcase group">
            <div className="k-download-showcase-glow" aria-hidden="true" />
            <div className="k-download-phones">
              {phones.map((phone) => (
                <figure
                  key={phone.slot}
                  className={`k-download-phone ${phone.featured ? 'is-featured' : ''}`}
                >
                  <PhoneShot slot={phone.slot} />
                  <figcaption>{phone.label}</figcaption>
                </figure>
              ))}
            </div>
          </motion.div>

          <div className="flex flex-col justify-center lg:w-[28rem] lg:flex-shrink-0 lg:pl-4">
            <motion.div variants={fadeUp} custom={0} className="mb-10">
              <p className="k-tag k-tag-dark mb-4">Mobile App</p>
              <h2 className="mb-4 font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
                {DOWNLOAD.title}
              </h2>
              <p className="text-lg leading-relaxed text-slate-400">
                {DOWNLOAD.subtitle}
              </p>
            </motion.div>

            {/* Premium 3-Step Timeline */}
            <motion.div variants={fadeUp} custom={1} className="mb-10 flex flex-col gap-4">
              {steps.map((step, i) => (
                <div key={step.label} className="group flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3.5 transition-all hover:border-teal-500/30 hover:bg-slate-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 font-display font-bold text-teal-400 ring-1 ring-teal-500/20 transition-colors group-hover:bg-teal-500/20 group-hover:text-teal-300">
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <strong className="text-sm font-semibold tracking-wide text-slate-200">
                      {step.label}
                    </strong>
                    <span className="text-xs text-slate-500 transition-colors group-hover:text-slate-400">
                      {step.desc}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Beautifully Aligned CTA Section */}
            <motion.div variants={fadeUp} custom={2} className="mt-6 flex flex-col items-start gap-4">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {/* Massive Primary CTA */}
                <a href={SITE.apkUrl} download="Kavach-App-v1.apk" className="group relative flex h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-teal-500 px-8 font-display text-[1.1rem] font-bold tracking-wide text-slate-900 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-[0_10px_40px_-10px_rgba(45,212,191,0.5)]">
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                    <div className="relative h-full w-10 bg-white/20" />
                  </div>
                  <Download className="h-5 w-5" strokeWidth={2.5} />
                  <span>{DOWNLOAD.button}</span>
                </a>
                
                {/* Meta & Warning Stacked */}
                <div className="flex flex-col gap-2">
                  <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-[0.75rem] font-semibold tracking-wide text-slate-300">
                    <span>v{DOWNLOAD.meta.version}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500" aria-hidden="true" />
                    <span>{DOWNLOAD.meta.minAndroid}</span>
                  </div>
                  <p className="flex items-center gap-1.5 pl-1 text-[0.75rem] font-medium text-amber-500/80">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {DOWNLOAD.installNote}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Crisp Footer Links */}
            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col gap-3.5 border-t border-slate-800/80 pt-6 text-[0.85rem] font-medium text-slate-400">
              <div className="flex items-center gap-2.5 transition-colors hover:text-slate-300">
                <Apple className="h-4 w-4 text-slate-500" />
                <span>{DOWNLOAD.iosNote}</span>
              </div>
              <div className="flex items-center gap-2.5 transition-colors hover:text-slate-300">
                <Monitor className="h-4 w-4 text-slate-500" />
                <span>{DOWNLOAD.staffNote}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
