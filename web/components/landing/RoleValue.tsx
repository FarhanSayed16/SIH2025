'use client';

import { motion } from 'framer-motion';
import { ROLES } from '@/lib/content/landing';
import { GraduationCap, BookOpen, Building2, Heart, CheckCircle2, Smartphone, MonitorSmartphone, Monitor } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const roleIcons = [GraduationCap, BookOpen, Building2, Heart];
const surfaceIcons = [Smartphone, MonitorSmartphone, Monitor, MonitorSmartphone];
const surfaceText = ['Android App', 'Web + Mobile', 'Web Console', 'Web + Mobile'];

export default function RoleValue() {
  return (
    <section id="roles" className="landing-section k-seam relative overflow-hidden bg-[#fafafa]">
      <div className="k-grid-faint" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="k-section-head mb-12">
          <p className="k-tag k-tag-neutral">Who it&apos;s for</p>
          <h2 className="landing-h2 text-slate-900">One platform, four points of view</h2>
          <p className="landing-lead text-slate-600">
            Students learning safety skills, teachers running drills, admins holding the crisis
            picture, parents staying informed — each role gets its own surface.
          </p>
        </motion.div>

        {/* Changed to a 2x2 grid to make the cards broader and more square */}
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          {ROLES.map((role, i) => {
            const Icon = roleIcons[i];
            const SurfaceIcon = surfaceIcons[i];

            return (
              <motion.div key={role.role} variants={fadeUp} custom={i + 1} className="h-full">
                <div
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                >
                  {/* Top Section (Header) - Deep Dark Professional Theme */}
                  <div className="flex flex-col items-start gap-5 bg-slate-800 px-8 py-7 sm:flex-row sm:items-center">
                    {/* Professional Icon Plate */}
                    <span className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-slate-700 text-slate-300 shadow-sm ring-1 ring-slate-600 transition-colors duration-300 group-hover:bg-teal-500/20 group-hover:text-teal-400 group-hover:ring-teal-500/40">
                      <Icon className="h-[1.4rem] w-[1.4rem]" strokeWidth={2} />
                    </span>

                    <div>
                      <h3 className="font-display text-[1.35rem] font-bold tracking-tight text-white">
                        {role.role}
                      </h3>
                      {/* Enterprise Badge */}
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-300 transition-colors group-hover:border-teal-500/40 group-hover:bg-teal-500/10 group-hover:text-teal-300">
                        <SurfaceIcon className="h-[0.8rem] w-[0.8rem]" />
                        {surfaceText[i]}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section (Body) - Solid White */}
                  <div className="flex flex-1 flex-col bg-white px-8 py-7">
                    <ul className="flex flex-col gap-4">
                      {role.points.slice(0, 3).map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3.5 text-[0.9375rem] leading-relaxed text-slate-600"
                        >
                          <CheckCircle2
                            className="mt-[0.2rem] h-[1.125rem] w-[1.125rem] shrink-0 text-teal-500 opacity-70 transition-opacity group-hover:opacity-100"
                            strokeWidth={2.5}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
