'use client';

import { motion } from 'framer-motion';
import { TEAM } from '@/lib/content/landing';
import { Code2, Brain, Palette } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const teamMeta = [
  { icon: Code2, img: '/team/farhan.jpeg', position: '24% 17%', scale: 1.1 },
  { icon: Brain, img: '/team/manas.jpeg', position: '43% 18%', scale: 1.3 },
  { icon: Palette, img: '/team/om.jpeg', position: '22% 0%', scale: 1.15 },
];

export default function Team() {
  return (
    <section id="team" className="landing-section-tight bg-dots relative overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="k-section-head k-section-head-center mb-10">
          <p className="k-tag">Team</p>
          <h2 className="landing-h2">The builders behind Kavach</h2>
          <p className="landing-lead">
            Three developers · Smart India Hackathon 2025 National First Prize
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {TEAM.map((member, i) => {
            const meta = teamMeta[i];
            const Icon = meta.icon;
            return (
              <motion.div key={member.name} variants={fadeUp} custom={i + 1} className="group">
                <div className="k-card flex h-full flex-col p-6">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-[1.04]">
                        <img 
                          src={meta.img}
                          alt={member.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          style={{
                            objectPosition: meta.position,
                            transform: `scale(${meta.scale})`,
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--k-line)] bg-white shadow-sm">
                        <Icon className="h-3.5 w-3.5 text-[var(--k-accent)]" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-display text-[16px] font-bold leading-tight text-[var(--k-ink)]">
                        {member.name}
                      </h3>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--k-accent)]">
                        Team Kavach
                      </p>
                    </div>
                  </div>

                  <p className="font-display mb-3 text-[13.5px] font-semibold leading-snug text-[var(--k-ink-soft)]">
                    {member.role}
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-[var(--k-muted)]">{member.summary}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Extended Acknowledgements Sub-section */}
        <motion.div variants={fadeUp} custom={4} className="mx-auto mt-10 max-w-4xl rounded-2xl border border-[var(--k-line)] bg-white/60 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Additional Members */}
            <div>
              <h3 className="mb-3 font-display text-[0.7rem] font-bold uppercase tracking-widest text-[var(--k-accent)]">
                Extended Team
              </h3>
              <ul className="flex flex-col gap-2.5 text-[0.85rem] font-medium text-[var(--k-ink-soft)]">
                <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--k-accent)]"></span>Jayprakash Morya</li>
                <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--k-accent)]"></span>Divyashree Gudla</li>
                <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--k-accent)]"></span>Madhura Navele</li>
              </ul>
            </div>

            {/* Mentors */}
            <div>
              <h3 className="mb-3 font-display text-[0.7rem] font-bold uppercase tracking-widest text-[var(--k-accent)]">
                Mentors
              </h3>
              <ul className="flex flex-col gap-2.5 text-[0.85rem] font-medium text-[var(--k-ink-soft)]">
                <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--k-accent)]"></span>Dr. Geeta Sahu</li>
                <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--k-accent)]"></span>Dr. Umesh Koyande</li>
              </ul>
            </div>

            {/* Institution */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="mb-3 font-display text-[0.7rem] font-bold uppercase tracking-widest text-[var(--k-accent)]">
                Institution
              </h3>
              <p className="text-[0.9rem] font-bold leading-relaxed text-[var(--k-ink)]">
                Vidyalankar School of Information Technology
              </p>
              <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--k-muted)]">
                Special thanks for the continuous support and guidance provided throughout the Smart India Hackathon process.
              </p>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
