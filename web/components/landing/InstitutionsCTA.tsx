'use client';

import { motion } from 'framer-motion';
import { INSTITUTIONS_CTA, SITE, HERO } from '@/lib/content/landing';
import { LogIn, Mail, ArrowRight, Download, Award } from 'lucide-react';
import { ShotStage } from './ProductShot';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const audiences = ['Schools', 'College campuses', 'Training institutes'];

/** Merged institutions + final CTA band */
export default function InstitutionsCTA() {
  return (
    <section id="institutions" className="landing-section relative overflow-hidden bg-white">
      <div className="k-grid-faint" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <motion.p variants={fadeUp} custom={0} className="k-tag">
              For institutions
            </motion.p>

            <motion.h2 variants={fadeUp} custom={1} className="landing-h2 mb-3.5 mt-5">
              {INSTITUTIONS_CTA.title}
            </motion.h2>

            <motion.p variants={fadeUp} custom={2} className="landing-lead mb-7">
              {INSTITUTIONS_CTA.subtitle}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mb-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <a href={INSTITUTIONS_CTA.mailto} className="cta-shimmer k-btn-primary group">
                <Mail className="h-4 w-4" />
                {INSTITUTIONS_CTA.ctaPrimary}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </a>
              <a href={SITE.loginUrl} className="k-btn-outline">
                <LogIn className="h-4 w-4" />
                {INSTITUTIONS_CTA.ctaSecondary}
              </a>
              <a
                href="#download"
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[var(--k-muted)] transition-colors hover:text-[var(--k-accent)]"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-2">
              {audiences.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full border border-[var(--k-line)] bg-[var(--k-paper)] px-3 py-1.5 text-[12px] font-semibold text-[var(--k-muted)]"
                >
                  {audience}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={5}
              className="mt-7 flex items-center gap-2.5 border-t border-[var(--k-line)] pt-6"
            >
              <Award className="h-4 w-4 flex-shrink-0 text-[var(--k-award-bright)]" />
              <span className="text-[13px] font-semibold text-[var(--k-award)]">{HERO.awardLine}</span>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} custom={3} className="group hidden lg:block">
            <ShotStage slot="institutionsAnalytics" />
            <div className="k-shot-caption">
              <span className="k-shot-caption-label">Drill analytics</span>
              <span className="k-shot-caption-note">Reportable readiness data per class</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
