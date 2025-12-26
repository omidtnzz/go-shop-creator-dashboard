"use client";

import React from "react";

type SplitBarProps = {
  leftLabel: string; // Instagram
  rightLabel: string; // TikTok
  title: string;
  subtitle: string;

  // 0..100
  leftPct: number; // purple fill from left
  rightPct: number; // black fill from right
};

export default function SplitBar({
  leftLabel,
  rightLabel,
  title,
  subtitle,
  leftPct,
  rightPct,
}: SplitBarProps) {
  const L = Math.max(0, Math.min(100, leftPct));
  const R = Math.max(0, Math.min(100, rightPct));

  const purple = "#7c3aed"; // insta purple
  const black = "#111827"; // tiktok black

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <div className="text-lg font-semibold text-neutral-900">{title}</div>
        <div className="mt-1 text-[13px] leading-snug text-neutral-600">{subtitle}</div>
      </div>

      {/* labels */}
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base font-medium">
          <span style={{ color: purple }}>{leftLabel}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base font-medium">
          <span style={{ color: black }}>{rightLabel}</span>
        </div>
      </div>

      {/* track */}
      <div className="relative h-9 w-full overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
        {/* left fill (purple) */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${L}%`, backgroundColor: purple }}
        />

        {/* right fill (black) */}
        <div
          className="absolute right-0 top-0 h-full rounded-full"
          style={{ width: `${R}%`, backgroundColor: black }}
        />

        {/* optional: center sheen line (subtle) */}
        <div className="absolute left-0 top-0 h-full w-full opacity-10" />
      </div>
    </div>
  );
}
