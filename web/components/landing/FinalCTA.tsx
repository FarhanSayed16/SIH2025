'use client';

import { motion } from 'framer-motion';
import { HERO, SITE } from '@/lib/content/landing';
import { Download, LogIn, Award, ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-24 md:py-32 bg-slate-50 bg-dots overflow-hidden">
      <div className="mesh-blob w-80 h-80 bg-teal-100 top-0 right-[-100px]" />

      <div className="landing-container text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-3">
            Ready to protect your school?
          </h2>
          <p className="text-base md:text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Join the mission to make every school safer with AI, IoT, and structured preparedness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <a
              href="#download"
              className="cta-shimmer group flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg shadow-teal-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Download APK
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href={SITE.loginUrl}
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <LogIn className="w-5 h-5" />
              Institution Login
            </a>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="px-6 py-4 text-base font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Contact Us
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-amber-600/60">
            <Award className="w-4 h-4" />
            <span className="font-medium">{HERO.awardLine}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
