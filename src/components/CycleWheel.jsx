function polarToCart(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Arc path along a ring (no fill, no center) — used to render donut segments
 * stroked with rounded line caps for a soft, modern look.
 *
 * `gap` is the angular padding (in degrees) carved off each end so that
 * segments don't visually touch — combined with stroke-linecap="round"
 * this creates the Apple-Health-style rounded segment effect.
 */
function arcRingPath(cx, cy, r, startDay, endDay, totalDays, gap = 2) {
  const startAngle = (startDay / totalDays) * 360 + gap / 2;
  const endAngle = (endDay / totalDays) * 360 - gap / 2;

  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * Lightens a hex color by mixing it with white. Used to build per-phase
 * gradient stops so each donut segment has a subtle inner shade variation.
 */
function lighten(hex, amount = 0.35) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/**
 * Apple-Health-style cycle donut. Thin colored ring (one segment per phase)
 * with rounded caps, a soft glowing pearl indicating the current day, and a
 * discreet centered day count. The pearl position animates smoothly when
 * `currentDay` changes (CSS transition on cx/cy).
 */
export default function CycleWheel({
  currentDay,
  phases,
  totalDays,
  dayLabel = "J",
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80; // mid-line radius of the donut ring
  const strokeWidth = 16;

  const currentPhase =
    phases.find(
      (p) => currentDay >= p.days[0] && currentDay <= p.days[1]
    ) ?? phases[0];

  const dotAngle = ((currentDay - 0.5) / totalDays) * 360;
  const dot = polarToCart(cx, cy, r, dotAngle);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Day ${currentDay} of ${totalDays}`}
    >
      <defs>
        {phases.map((phase, i) => {
          const startAngle = ((phase.days[0] - 1) / totalDays) * 360;
          const endAngle = (phase.days[1] / totalDays) * 360;
          const a = polarToCart(cx, cy, r, startAngle);
          const b = polarToCart(cx, cy, r, endAngle);
          return (
            <linearGradient
              key={`grad-${i}`}
              id={`phase-grad-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            >
              <stop offset="0%" stopColor={lighten(phase.color, 0.18)} />
              <stop offset="100%" stopColor={phase.color} />
            </linearGradient>
          );
        })}

        <radialGradient id="pearl-halo">
          <stop
            offset="0%"
            stopColor={currentPhase.color}
            stopOpacity={0.55}
          />
          <stop
            offset="70%"
            stopColor={currentPhase.color}
            stopOpacity={0.12}
          />
          <stop
            offset="100%"
            stopColor={currentPhase.color}
            stopOpacity={0}
          />
        </radialGradient>
      </defs>

      {/* Background track — barely visible, sits underneath the segments */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,0.04)"
        strokeWidth={strokeWidth}
      />

      {/* Phase segments as stroked arcs (donut, not pie) — inactive phases
         fade to ~30% opacity so the current phase visually "owns" the ring */}
      {phases.map((phase, i) => {
        const isCurrent = phase.id === currentPhase.id;
        return (
          <path
            key={i}
            d={arcRingPath(
              cx,
              cy,
              r,
              phase.days[0] - 1,
              phase.days[1],
              totalDays
            )}
            stroke={`url(#phase-grad-${i})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            opacity={isCurrent ? 1 : 0.3}
            style={{ transition: "opacity 500ms ease" }}
          />
        );
      })}

      {/* Soft halo behind the pearl — bigger blurred glow in phase color */}
      <circle
        cx={dot.x}
        cy={dot.y}
        r={18}
        fill="url(#pearl-halo)"
        style={{
          transition: "cx 700ms cubic-bezier(.4,.0,.2,1), cy 700ms cubic-bezier(.4,.0,.2,1)",
        }}
      />

      {/* The pearl itself — bright white with a thin colored ring */}
      <circle
        cx={dot.x}
        cy={dot.y}
        r={6}
        fill="white"
        stroke={currentPhase.color}
        strokeWidth={2.5}
        style={{
          transition: "cx 700ms cubic-bezier(.4,.0,.2,1), cy 700ms cubic-bezier(.4,.0,.2,1)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
        }}
      />

      {/* Centered day label — stacked: big number, tiny "of total" below */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1c1c1e"
        fontSize={36}
        fontWeight={600}
        letterSpacing={-0.5}
      >
        {currentDay}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(60,60,67,0.55)"
        fontSize={11}
        fontWeight={500}
        letterSpacing={1.2}
      >
        {dayLabel} / {totalDays}
      </text>
    </svg>
  );
}
