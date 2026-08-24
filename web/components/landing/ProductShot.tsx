'use client';

import { SHOT_SLOT_BY_ID, shotStyle, type ShotSlotId } from '@/lib/landing/shot-config';
import { useShotConfig } from '@/lib/landing/use-shot-config';

export function BrowserShot({
  slot,
  className = '',
  bodyRatio,
}: {
  slot: ShotSlotId;
  className?: string;
  /** Pin the viewport area to the capture ratio so nothing is cropped sideways. */
  bodyRatio?: string;
}) {
  const meta = SHOT_SLOT_BY_ID[slot];
  const config = useShotConfig(slot);

  return (
    <div className={`k-browser-frame ${className}`}>
      <div className="k-browser-chrome">
        <span className="k-browser-dot bg-red-400/80" />
        <span className="k-browser-dot bg-amber-400/80" />
        <span className="k-browser-dot bg-emerald-400/80" />
        <div className="k-browser-url">{meta.url ?? 'kavach.app'}</div>
      </div>
      <div
        className="k-browser-body"
        style={bodyRatio ? { aspectRatio: bodyRatio, flex: 'none' } : undefined}
      >
        <img src={config.src} alt={meta.alt} style={shotStyle(config)} />
      </div>
    </div>
  );
}

export function PhoneShot({
  slot,
  className = '',
}: {
  slot: ShotSlotId;
  className?: string;
}) {
  const meta = SHOT_SLOT_BY_ID[slot];
  const config = useShotConfig(slot);

  return (
    <div className={`k-phone-frame ${className}`}>
      <img src={config.src} alt={meta.alt} style={shotStyle(config)} />
    </div>
  );
}

/**
 * Fixed-ratio pedestal so mixed phone/browser shots stay aligned in a grid.
 */
export function ShotStage({
  slot,
  tone = 'light',
  className = '',
  variant = 'default',
}: {
  slot: ShotSlotId;
  tone?: 'light' | 'dark';
  className?: string;
  /** pillar = approach cards · feature = platform capability panel · arch = how-it-works cards */
  variant?: 'default' | 'pillar' | 'feature' | 'arch';
}) {
  const meta = SHOT_SLOT_BY_ID[slot];
  const tall = meta.stage === 'tall';
  const isPhone = meta.kind === 'phone';

  // A 9:20 phone capture shrinks to an unreadable sliver inside a wide stage,
  // so let it render large and crop below the fold instead.
  const bleedPhone = isPhone && !tall;

  const stageClass =
    variant === 'feature'
      ? isPhone
        ? 'k-shot-stage-feature k-shot-stage-feature-phone'
        : 'k-shot-stage-feature k-shot-stage-feature-browser'
      : variant === 'arch'
        ? isPhone
          ? 'k-shot-stage-arch k-shot-stage-arch-phone'
          : 'k-shot-stage-arch k-shot-stage-arch-browser'
        : variant === 'pillar'
          ? 'k-shot-stage-pillar'
          : '';

  return (
    <div
      className={`k-shot-stage ${tone === 'dark' ? 'k-shot-stage-dark' : ''} ${
        tall ? 'k-shot-stage-tall' : ''
      } ${stageClass} ${className}`}
    >
      <div className={bleedPhone ? 'k-shot-inner-bleed' : 'k-shot-inner'}>
        {isPhone ? <PhoneShot slot={slot} /> : <BrowserShot slot={slot} />}
      </div>
    </div>
  );
}
