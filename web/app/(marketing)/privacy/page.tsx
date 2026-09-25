import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Kavach',
  description: 'Kavach privacy policy and data handling practices for school safety platform.',
};

export default function PrivacyPage() {
  return (
    <div className="landing-root">
      <div className="min-h-screen bg-white text-slate-700">
        <div className="landing-container py-24 md:py-32 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors mb-8"
          >
            ← Back to Kavach
          </Link>

          <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400 mb-10">Last updated: August 2026</p>

          <div className="space-y-10 text-sm leading-relaxed">
            <section>
              <h2 className="font-display font-semibold text-xl text-slate-900 mb-3">
                Overview
              </h2>
              <p className="text-slate-600">
                Kavach is a disaster preparedness and school safety platform developed
                for Smart India Hackathon 2025. We are committed to protecting the
                privacy and data of all users — students, teachers, administrators,
                and parents.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-slate-900 mb-3">
                Data we collect
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>Account information (name, email, role, institution)</li>
                <li>Drill participation and learning progress</li>
                <li>Device telemetry (only from IoT-enabled deployments)</li>
                <li>Push notification tokens for alert delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-slate-900 mb-3">
                How we use your data
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>To provide safety education and drill management services</li>
                <li>To send critical alerts and notifications</li>
                <li>To generate preparedness reports for institutions</li>
                <li>To improve platform performance and features</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-slate-900 mb-3">
                Data protection
              </h2>
              <p className="text-slate-600">
                All production deployments use HTTPS encryption, authenticated
                access, and role-based permissions. Data is stored securely on
                MongoDB Atlas with industry-standard protections. We do not sell
                or share user data with third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-slate-900 mb-3">
                Contact
              </h2>
              <p className="text-slate-600">
                For privacy-related inquiries, please contact{' '}
                <a
                  href="mailto:kavach.sih2025@gmail.com"
                  className="text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2"
                >
                  kavach.sih2025@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
