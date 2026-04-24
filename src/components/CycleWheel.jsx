function polarToCart(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx, cy, r, startDay, endDay, totalDays) {
  const startAngle = (startDay / totalDays) * 360;
  const endAngle = (endDay / totalDays) * 360;

  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function CycleWheel({ currentDay, phases, totalDays, dayLabel = "J" }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;

  const dotAngle = ((currentDay - 1) / totalDays) * 360;
  const dot = polarToCart(cx, cy, r * 0.7, dotAngle);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {phases.map((phase, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, r, phase.days[0] - 1, phase.days[1], totalDays)}
          fill={phase.color}
          opacity={0.72}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={2}
        />
      ))}

      <circle cx={cx} cy={cy} r={38} fill="rgba(255,255,255,0.92)" />

      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#111111"
        fontSize={22}
        fontWeight="bold"
      >
        {dayLabel}
        {currentDay}
      </text>

      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="rgba(60,60,67,0.6)"
        fontSize={10}
      >
        / {totalDays}
      </text>

      <circle
        cx={dot.x}
        cy={dot.y}
        r={7}
        fill="white"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.18))" }}
      />
    </svg>
  );
}
