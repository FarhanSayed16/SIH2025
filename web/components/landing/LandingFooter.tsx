'use client';

import { SITE } from '@/lib/content/landing';
import { KavachLogo } from '@/components/branding/KavachLogo';
import { Award, Mail, Github, Linkedin, Globe } from 'lucide-react';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Recognition', href: '#recognition' },
      { label: 'Platform', href: '#capabilities' },
      { label: 'Architecture', href: '#architecture' },
      { label: 'Download app', href: '#download' },
      { label: 'Institution login', href: SITE.loginUrl },
    ],
  },
  {
    title: 'Alignment',
    links: [
      { label: 'Ministry of Education', href: '#recognition' },
      { label: 'Government of Punjab', href: '#recognition' },
      { label: 'NDMA', href: '#recognition' },
    ],
    note: 'Thematic alignment — not a formal partnership.',
  },
  {
    title: 'Team',
    links: [
      { label: 'Farhan Sayed', href: '#team' },
      { label: 'Manas Sawant', href: '#team' },
      { label: 'Om Parab', href: '#team' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="relative bg-[var(--k-night)] text-slate-400">
      <div className="k-tricolour-rule absolute left-0 right-0 top-0" />

      <div className="landing-container py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <a href="#hero" className="mb-4 inline-flex items-center gap-2.5">
              <KavachLogo slot="footer" />
              <span className="font-display text-lg font-bold text-white">Kavach</span>
            </a>
            <p className="mb-5 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
              {SITE.description}. Built to help schools prevent, detect, and respond.
            </p>

            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2">
              <Award className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span className="text-[12px] font-semibold text-amber-200/85">
                SIH 2025 · National First Prize
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="mailto:farhanbuilds16@gmail.com"
                className="flex items-center gap-2 text-[13px] text-slate-500 transition-colors hover:text-slate-300"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">farhanbuilds16@gmail.com</span>
              </a>
              <a
                href="https://farhanbuilds.in/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[13px] text-slate-500 transition-colors hover:text-slate-300"
              >
                <Globe className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">farhanbuilds.in</span>
              </a>
              <div className="mt-1 flex gap-4">
                <a
                  href="https://github.com/FarhanSayed16"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 transition-colors hover:text-slate-300"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/farhansayed16/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 transition-colors hover:text-slate-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <div key={column.title} className="md:col-span-2">
              <h4 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-300">
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-slate-500 transition-colors hover:text-slate-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              {column.note && (
                <p className="mt-3 text-[11px] leading-relaxed text-slate-600">{column.note}</p>
              )}
            </div>
          ))}

          <div className="md:col-span-2">
            <h4 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-300">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={SITE.privacyUrl}
                  className="text-[13px] text-slate-500 transition-colors hover:text-slate-300"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a href="#faq" className="text-[13px] text-slate-500 transition-colors hover:text-slate-300">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[12px] text-slate-600">{SITE.copyright}</p>
          <p className="max-w-xl text-[11.5px] leading-relaxed text-slate-600 md:text-right">
            An independent platform built for Smart India Hackathon 2025. Ministry, state, and agency
            references indicate thematic alignment only.
          </p>
        </div>
      </div>
    </footer>
  );
}
