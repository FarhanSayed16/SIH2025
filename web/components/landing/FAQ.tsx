'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQ as faqData, SITE } from '@/lib/content/landing';
import { Plus, Mail } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="landing-section-tight k-seam relative overflow-hidden bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <motion.div variants={fadeUp} custom={0} className="k-section-head lg:sticky lg:top-28 lg:self-start">
            <p className="k-tag">FAQ</p>
            <h2 className="landing-h2">Questions schools ask first</h2>
            <p className="landing-lead">
              Straight answers about scope, hardware, and what Kavach does and does not replace.
            </p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="mt-1 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--k-accent)] transition-colors hover:text-[var(--k-accent-bright)]"
            >
              <Mail className="h-4 w-4" />
              Ask us something else
            </a>
          </motion.div>

          <div className="divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
            {faqData.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div key={item.q} variants={fadeUp} custom={i + 1}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group w-full py-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <h3
                        className={`font-display text-[15.5px] font-bold leading-snug transition-colors md:text-base ${
                          isOpen ? 'text-[var(--k-accent)]' : 'text-[var(--k-ink)] group-hover:text-[var(--k-accent)]'
                        }`}
                      >
                        {item.q}
                      </h3>
                      <span
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border transition-all duration-300 ${
                          isOpen
                            ? 'rotate-45 border-[var(--k-accent)] bg-[var(--k-accent)] text-white'
                            : 'border-[var(--k-line)] bg-white text-[var(--k-muted)] group-hover:border-[var(--k-line-strong)]'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 max-w-2xl pr-10 text-[14.5px] leading-relaxed text-[var(--k-muted)]">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
