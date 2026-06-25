"use client";

// A compact stacked bar of the placement distribution (1..8).
// Placements 1-4 (top 4) are green-tinted, 5-8 red-tinted.
const COLORS = [
  "#34d399", "#4ade80", "#a3e635", "#bef264", // 1-4
  "#fca5a5", "#f87171", "#ef4444", "#dc2626", // 5-8
];

export default function PlacementBar({
  distribution,
  height = 8,
}: {
  distribution: number[];
  height?: number;
}) {
  return (
    <div
      className="flex w-full overflow-hidden rounded"
      style={{ height }}
      role="img"
      aria-label="Placement distribution"
    >
      {distribution.map((p, i) => (
        <div
          key={i}
          style={{ width: `${Math.max(0, p) * 100}%`, background: COLORS[i] }}
          title={`${i + 1}${["st", "nd", "rd"][i] || "th"}: ${(p * 100).toFixed(0)}%`}
        />
      ))}
    </div>
  );
}
