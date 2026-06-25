"use client";

import type { FieldUnit, Hero } from "@/lib/game/types";
import UnitCard from "./UnitCard";

const ROWS = 4;
const COLS = 7;
const CELLS = ROWS * COLS;

export default function Board({
  hero,
  selectedUid,
  onSelect,
  onCell,
  onInspect,
  readOnly = false,
}: {
  hero: Hero;
  selectedUid?: string | null;
  onSelect?: (uid: string) => void;
  onCell?: (cell: number) => void;
  onInspect?: (unit: FieldUnit, rect: DOMRect) => void;
  readOnly?: boolean;
}) {
  const byCell = new Map<number, (typeof hero.board)[number]>();
  hero.board.forEach((u) => {
    if (u.cell != null) byCell.set(u.cell, u);
  });
  const dropping = !readOnly && !!selectedUid;

  return (
    <div className="grid grid-cols-7 gap-1.5" style={{ aspectRatio: "7 / 4" }}>
      {Array.from({ length: CELLS }).map((_, i) => {
        const unit = byCell.get(i);
        return (
          <div
            key={i}
            className={`cell ${dropping && !unit ? "cell-drop cursor-pointer" : ""}`}
            onClick={() => !readOnly && onCell?.(i)}
          >
            {unit ? (
              <UnitCard
                unit={unit}
                selected={unit.uid === selectedUid}
                onClick={readOnly ? undefined : () => onSelect?.(unit.uid)}
                onInspect={onInspect ? (rect) => onInspect(unit, rect) : undefined}
              />
            ) : (
              <span className="h-1 w-1 rounded-full bg-ink-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}
