"use client";

export default function Sparkline({
  values,
  max,
  color = "#34d399",
  height = 28,
}: {
  values: number[];
  max: number;
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const n = values.length;
  const pts = values.map((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = height - Math.max(0, Math.min(1, v / (max || 1))) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={`0,${height} ${pts.join(" ")} 100,${height}`} fill={`${color}1f`} stroke="none" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}
