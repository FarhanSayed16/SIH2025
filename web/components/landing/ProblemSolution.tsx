'use client';

import { motion } from 'framer-motion';
import { PROBLEM, SOLUTION } from '@/lib/content/landing';
import { Shield, Radar, Zap, X, Check, ShieldCheck } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const pillarMeta: {
  icon: typeof Shield;
  note: string;
  tone: 'saffron' | 'navy' | 'green';
}[] = [
  { icon: Shield, note: 'NDMA-aligned modules', tone: 'saffron' },
  { icon: Radar, note: 'Classroom sensor nodes', tone: 'navy' },
  { icon: Zap, note: 'Live drills & alerts', tone: 'green' },
];

export default function ProblemSolution() {
  return (
    <section id="solution" className="landing-section k-seam relative overflow-hidden bg-[var(--k-paper)]">
      <div className="k-grid-faint" />

      <div className="landing-container relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.div variants={fadeUp} custom={0} className="k-section-head mb-9">
            <p className="k-tag k-tag-neutral">The gap</p>
            <h2 className="landing-h2">{PROBLEM.title}</h2>
            <p className="landing-lead">{PROBLEM.subtitle}</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="k-compare">
            <div className="k-compare-head">
              <div>Challenge</div>
              <div>Schools today</div>
              <div>
                <ShieldCheck className="h-3.5 w-3.5" />
                With Kavach
              </div>
            </div>

            {PROBLEM.rows.map((row) => (
              <div key={row.pain} className="k-compare-row">
                <div className="k-compare-challenge">
                  <span className="k-compare-dot" />
                  <p>{row.pain}</p>
                </div>
                <div className="k-compare-today">
                  <X className="k-compare-x" strokeWidth={3} />
                  <p>{row.today}</p>
                </div>
                <div className="k-compare-with">
                  <Check className="k-compare-check" strokeWidth={3} />
                  <p>{row.withKavach}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 md:mt-14"
        >
          <motion.div variants={fadeUp} custom={0} className="k-section-head k-section-head-center mb-10">
            <p className="k-tag">Our approach</p>
            <h2 className="landing-h2">{SOLUTION.title}</h2>
            <p className="landing-lead">{SOLUTION.oneLiner}</p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {SOLUTION.pillars.map((pillar, i) => {
              const meta = pillarMeta[i];
              const Icon = meta.icon;
              return (
                <motion.div key={pillar.name} variants={fadeUp} custom={i + 1} className="group">
                  <div className="k-pillar-card" data-tone={meta.tone}>
                    <div className="p-5 pb-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="k-pillar-icon">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-bold leading-none text-[var(--k-ink)]">
                            {pillar.name}
                          </h3>
                          <p className="k-pillar-note">
                            {String(i + 1).padStart(2, '0')} · {meta.note}
                          </p>
                        </div>
                      </div>
                      <p className="text-[14px] leading-relaxed text-[var(--k-muted)]">{pillar.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
