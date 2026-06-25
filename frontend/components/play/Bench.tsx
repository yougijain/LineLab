"use client";

import type { FieldUnit, Hero } from "@/lib/game/types";
import UnitCard from "./UnitCard";

export default function Bench({
  hero,
  selectedUid,
  onSelect,
  onInspect,
}: {
  hero: Hero;
  selectedUid?: string | null;
  onSelect?: (uid: string) => void;
  onInspect?: (unit: FieldUnit, rect: DOMRect) => void;
}) {
  return (
    <div className="grid grid-cols-9 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => {
        const unit = hero.bench[i];
        return (
          <div key={i} className="cell aspect-square bg-ink-900/30">
            {unit && (
              <UnitCard
                unit={unit}
                selected={unit.uid === selectedUid}
                onClick={() => onSelect?.(unit.uid)}
                onInspect={onInspect ? (rect) => onInspect(unit, rect) : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
