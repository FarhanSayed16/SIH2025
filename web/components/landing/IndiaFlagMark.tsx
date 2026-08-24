/** Official tricolour with a 24-spoke Ashoka Chakra in navy. */
export function IndiaFlagMark({
  className = '',
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      className={className}
      viewBox="0 0 90 60"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'Flag of India'}
    >
      <rect width="90" height="20" fill="#FF9933" />
      <rect y="20" width="90" height="20" fill="#FFFFFF" />
      <rect y="40" width="90" height="20" fill="#138808" />
      <g transform="translate(45 30)">
        <circle r="8.4" fill="none" stroke="#000080" strokeWidth="1.15" />
        <circle r="1.45" fill="#000080" />
        {spokes.map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-8.4"
            x2="0"
            y2="-1.7"
            stroke="#000080"
            strokeWidth="0.85"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
}
