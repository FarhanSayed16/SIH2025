'use client';

import { motion, type Variants } from 'framer-motion';
import { ARCHITECTURE } from '@/lib/content/landing';
import {
  Smartphone,
  Monitor,
  Cpu,
  Server,
  Brain,
  Bell,
  Database,
  Activity,
  ArrowRight,
  Wifi,
  ShieldCheck,
  Zap
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const pulseAnim: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: [0, 1, 0], 
    x: [0, 50],
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: "easeInOut",
      repeatDelay: 0.5 
    } 
  }
};

const surfaces = [
  { icon: Smartphone, title: 'Mobile App', desc: 'Students & Parents', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { icon: Monitor, title: 'Web Console', desc: 'Teachers & Admins', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  { icon: Cpu, title: 'IoT Nodes', desc: 'Classroom Sensors', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
];

const services = [
  { icon: Brain, title: 'Gemini AI', desc: 'Alert drafting & quizzes', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { icon: Database, title: 'MongoDB', desc: 'Secure data store', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: Bell, title: 'FCM / Email', desc: 'Push notifications', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { icon: Activity, title: 'Redis', desc: 'Real-time broker', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
];

export default function HowItWorks() {
  return (
    <section id="architecture" className="landing-section relative overflow-hidden bg-white">
      <div className="k-grid-faint" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="landing-container relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="k-section-head k-section-head-center mb-16">
          <p className="k-tag k-tag-neutral">Architecture</p>
          <h2 className="landing-h2 text-slate-900">How the system works</h2>
          <p className="landing-lead text-slate-600">
            One extremely fast, secure backbone connecting learning, sensing, and alerts across every surface.
          </p>
        </motion.div>

        {/* The Animated Diagram - Light Theme */}
        <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-between gap-12 lg:flex-row lg:items-stretch lg:gap-8">
          
          {/* Column 1: Surfaces */}
          <motion.div variants={fadeUp} custom={1} className="flex w-full flex-col justify-center gap-4 lg:w-72">
            <h3 className="mb-2 text-center font-display text-sm font-bold tracking-widest text-slate-400 uppercase">1. Surfaces</h3>
            {surfaces.map((item, i) => (
              <div key={item.title} className={`group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                  <item.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-800">{item.title}</h4>
                  <p className="text-xs font-medium text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Connection 1 */}
          <div className="flex flex-col items-center justify-center lg:flex-row">
            <div className="flex h-16 w-px items-center justify-center bg-slate-200 lg:h-px lg:w-16">
               <motion.div 
                 variants={pulseAnim}
                 className="hidden h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)] lg:block"
               />
               <ArrowRight className="h-5 w-5 text-slate-300 lg:hidden" />
            </div>
          </div>

          {/* Column 2: The Core API Hub */}
          <motion.div variants={fadeUp} custom={2} className="relative z-10 flex w-full flex-col justify-center lg:w-80">
            <h3 className="mb-6 text-center font-display text-sm font-bold tracking-widest text-slate-400 uppercase">2. Kavach Engine</h3>
            
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-500 hover:border-teal-200 hover:shadow-2xl">
              {/* Subtle Light Hub Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-80" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:ring-teal-100">
                  <Server className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h4 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">Kavach API</h4>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  The central nervous system. Processes sensor streams, triggers AI drafting, and routes alerts instantly.
                </p>
                
                <div className="flex w-full items-center justify-center gap-3 border-t border-slate-100 pt-5">
                   <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
                     <Wifi className="h-3 w-3 text-teal-500" /> Socket.io
                   </div>
                   <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
                     <ShieldCheck className="h-3 w-3 text-slate-400" /> REST
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Connection 2 */}
          <div className="flex flex-col items-center justify-center lg:flex-row">
            <div className="flex h-16 w-px items-center justify-center bg-slate-200 lg:h-px lg:w-16">
               <motion.div 
                 variants={pulseAnim}
                 className="hidden h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)] lg:block"
               />
               <ArrowRight className="h-5 w-5 text-slate-300 lg:hidden" />
            </div>
          </div>

          {/* Column 3: Services */}
          <motion.div variants={fadeUp} custom={3} className="flex w-full flex-col justify-center gap-3 lg:w-72">
            <h3 className="mb-3 text-center font-display text-sm font-bold tracking-widest text-slate-400 uppercase">3. Cloud Services</h3>
            {services.map((item, i) => (
              <div key={item.title} className={`group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:shadow-md`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-800">{item.title}</h4>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
