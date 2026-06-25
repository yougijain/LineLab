"use client";

import { useRef } from "react";
import type { FieldUnit } from "@/lib/game/types";
import { MODULES_BY_KEY } from "@/lib/game/data";

export default function UnitCard({
  unit,
  selected,
  onClick,
  onInspect,
  compact = true,
}: {
  unit: FieldUnit;
  selected?: boolean;
  onClick?: () => void;
  onInspect?: (rect: DOMRect) => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireInspect = () => {
    if (ref.current && onInspect) onInspect(ref.current.getBoundingClientRect());
  };
  const onEnter = () => {
    if (!onInspect) return;
    timer.current = setTimeout(fireInspect, 450);
  };
  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onContextMenu={(e) => {
        if (onInspect) {
          e.preventDefault();
          fireInspect();
        }
      }}
      className={`unit tier-${unit.tier} ${selected ? "unit-sel" : ""}`}
      title={unit.traits.join(" · ")}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="num text-[9px] text-amber-300">{"★".repeat(unit.star)}</span>
        {unit.items.length > 0 && (
          <span className="flex gap-0.5">
            {unit.items.slice(0, 3).map((m, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-sm"
                style={{
                  background:
                    MODULES_BY_KEY[m]?.itemClass === "offensive"
                      ? "#fbbf24"
                      : MODULES_BY_KEY[m]?.itemClass === "defensive"
                        ? "#38bdf8"
                        : "#a78bfa",
                }}
              />
            ))}
          </span>
        )}
      </div>
      <div
        className={`truncate font-medium leading-tight text-white ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {unit.name}
      </div>
    </button>
  );
}
