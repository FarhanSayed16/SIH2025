'use client';

import { LOGO_SRC, type LogoSlotId } from '@/lib/branding/logo-config';
import { useLogoConfig } from '@/lib/branding/use-logo-config';

interface KavachLogoProps {
  slot: LogoSlotId;
  className?: string;
  alt?: string;
}

export function KavachLogo({ slot, className = '', alt = 'Kavach' }: KavachLogoProps) {
  const config = useLogoConfig(slot);

  const boxStyle: React.CSSProperties = {
    width: config.width,
    height: config.height,
    padding: config.padding,
    borderRadius: config.borderRadius,
    background: config.background === 'transparent' ? undefined : config.background,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: config.objectFit,
    objectPosition: `${config.objectPositionX}% ${config.objectPositionY}%`,
    transform: config.scale !== 1 ? `scale(${config.scale})` : undefined,
  };

  return (
    <span className={className} style={boxStyle}>
      <img src={LOGO_SRC} alt={alt} style={imgStyle} draggable={false} />
    </span>
  );
}
