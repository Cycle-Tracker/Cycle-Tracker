const DEFAULT_MAX = 5;

export default function EnergyDots({
  level,
  max = DEFAULT_MAX,
  activeColor = "#111111",
  inactiveColor = "rgba(60, 60, 67, 0.16)",
}) {
  const dots = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="energy-dots" aria-label={`energy ${level}/${max}`}>
      {dots.map((i) => {
        const active = i <= level;
        return (
          <div
            key={i}
            className={`energy-dot ${active ? "active" : ""}`}
            style={{
              background: active ? activeColor : inactiveColor,
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}
