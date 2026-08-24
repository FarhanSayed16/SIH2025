'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAPABILITIES } from '@/lib/content/landing';
import { BookOpen, Brain, Radio, Cpu, Check } from 'lucide-react';
import { ShotStage } from './ProductShot';
import { SHOT_SLOT_BY_ID, type ShotSlotId } from '@/lib/landing/shot-config';

const bandIcons = [BookOpen, Brain, Radio, Cpu];

const bandShots: { slot: ShotSlotId; caption: string; short: string }[] = [
  { slot: 'capLearning', caption: 'Learning tracks in the student app', short: 'Learning' },
  { slot: 'capAi', caption: 'Ask Kavach — multilingual safety assistant', short: 'AI' },
  { slot: 'capOps', caption: 'Drill lifecycle from the staff console', short: 'Operations' },
  { slot: 'capIot', caption: 'Sensor health and telemetry', short: 'IoT' },
];

export default function PlatformCapabilities() {
  const [activeTab, setActiveTab] = useState(0);
  const active = bandShots[activeTab];
  const ActiveIcon = bandIcons[activeTab];
  const shotKind = SHOT_SLOT_BY_ID[active.slot].kind;

  return (
    <section id="capabilities" className="landing-section k-seam relative overflow-hidden bg-white">
      <div className="k-grid-faint" />

      <div className="landing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <div className="k-section-head mb-8">
            <p className="k-tag">Platform</p>
            <h2 className="landing-h2">Everything schools need, in one platform</h2>
            <p className="landing-lead">
              Four capability bands. Adopt the whole system or start with learning and drills and
              switch on sensing later.
            </p>
          </div>

          <div className="k-cap-board">
            <div className="k-cap-tabs" role="tablist" aria-label="Platform capability bands">
              {CAPABILITIES.map((cap, i) => {
                const Icon = bandIcons[i];
                const isActive = activeTab === i;
                return (
                  <button
                    key={cap.band}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(i)}
                    className={`k-cap-tab ${isActive ? 'is-active' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{cap.band}</span>
                    <span className="sm:hidden">{bandShots[i].short}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="k-cap-body"
              >
                <div className="k-cap-copy">
                  <div className="k-cap-copy-head">
                    <span className="k-cap-icon">
                      <ActiveIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3>{CAPABILITIES[activeTab].band}</h3>
                      <p>
                        Band {activeTab + 1} of {CAPABILITIES.length}
                      </p>
                    </div>
                  </div>

                  <ul className="k-cap-list">
                    {CAPABILITIES[activeTab].features.map((feat) => (
                      <li key={feat}>
                        <Check className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="k-cap-foot">
                    <p className="k-cap-caption">{active.caption}</p>
                    {activeTab === 3 && (
                      <p className="k-cap-hint">
                        IoT ingest is optional — enable it when classroom sensors are commissioned.
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`k-cap-media group ${shotKind === 'phone' ? 'is-phone' : 'is-browser'}`}
                >
                  <ShotStage slot={active.slot} variant="feature" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
