'use client';

import { motion } from 'framer-motion';
import { RECOGNITION } from '@/lib/content/landing';
import { ShieldCheck } from 'lucide-react';
import { IndiaFlagMark } from './IndiaFlagMark';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function ChakraMark() {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg className="k-citation-chakra" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="88" fill="none" stroke="#e8d48b" strokeWidth="1.4" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#e8d48b" strokeWidth="1" />
      <circle cx="100" cy="100" r="10" fill="none" stroke="#e8d48b" strokeWidth="1.6" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="22"
          x2="100"
          y2="90"
          stroke="#e8d48b"
          strokeWidth="1.15"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
    </svg>
  );
}

export default function Recognition() {
  return (
    <section id="recognition" className="landing-section relative overflow-hidden bg-white">
      <div className="k-grid-faint" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="k-section-head mb-10">
          <p className="k-tag">Recognition</p>
          <h2 className="landing-h2">{RECOGNITION.title}</h2>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="mb-10 md:mb-12">
          <article className="k-citation">
            <div className="k-citation-bands" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="k-citation-grid">
              <div className="k-citation-rail">
                <ChakraMark />
                <div>
                  <p className="k-citation-event">{RECOGNITION.award.name}</p>
                  <p className="k-citation-place">1st</p>
                  <p className="k-citation-prize">Prize</p>
                </div>
                <p className="k-citation-seal">
                  <IndiaFlagMark className="k-citation-flag" />
                  National award
                </p>
              </div>

              <div className="k-citation-body">
                <p className="k-citation-lead">{RECOGNITION.award.framing}</p>
                <dl className="k-citation-meta">
                  <div>
                    <dt>Recognised at</dt>
                    <dd>Smart India Hackathon 2025</dd>
                  </div>
                  <div>
                    <dt>Problem theme</dt>
                    <dd>{RECOGNITION.award.theme}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="k-section-head mb-8">
          <p className="k-tag k-tag-neutral">Alignment</p>
          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--k-ink)] md:text-3xl">
            {RECOGNITION.alignment.title}
          </h3>
          <p className="landing-lead">
            Kavach helps schools move from paper SOPs to a living system: continuous learning, live
            sensing, and fast communication — aligned with the goals below.
          </p>
        </motion.div>

        <div className="k-align-grid">
          {RECOGNITION.institutions.map((inst, i) => {
            return (
              <motion.article
                key={inst.shortName}
                variants={fadeUp}
                custom={i + 3}
                className="k-align-card"
              >
                <div className="k-emblem-plate">
                  <img src={inst.logo} alt={`${inst.name} official emblem`} />
                </div>
                <div className="k-align-meta">
                  <span className="k-align-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="k-align-chip">{inst.shortName}</span>
                </div>
                <h4 className="font-display text-[16.5px] font-bold leading-snug">{inst.name}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--k-muted)]">{inst.context}</p>
              </motion.article>
            );
          })}
        </div>

        <motion.div variants={fadeUp} custom={6} className="k-align-note">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c9a227]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--k-muted)]">
            {RECOGNITION.alignment.disclaimer}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
