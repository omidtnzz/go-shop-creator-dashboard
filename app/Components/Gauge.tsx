"use client";

import React from "react";

type GaugeProps = {
  leftLabel: string;   // Instagram
  rightLabel: string;  // TikTok
  title: string;       // "Revenue" / "Views"
  subtitle: string;    // explanation sentence
  // needlePosition: 0 = far left, 0.5 = center, 1 = far right
  needlePosition: number;
};

export default function Gauge({
  leftLabel,
  rightLabel,
  title,
  subtitle,
  needlePosition,
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(1, needlePosition));

  // Needle angle: -90deg (left) to +90deg (right)
  const angle = -90 + clamped * 180;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <div className="text-xl font-semibold text-neutral-900">{title}</div>
        <div className="mt-1 text-sm text-neutral-600">{subtitle}</div>
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-[360px]">
        {/* Semi-circle */}
        <div className="relative h-[170px] w-full overflow-hidden">
          <div
            className="absolute left-1/2 top-[10px] h-[320px] w-[320px] -translate-x-1/2 rounded-full"
            style={{
              background:
                "conic-gradient(from 180deg, #ef4444 0deg, #f59e0b 70deg, #84cc16 140deg, #22c55e 180deg)",
            }}
          />
          {/* Mask bottom half to make it a semi-circle */}
          <div className="absolute bottom-0 left-0 h-[50%] w-full bg-white" />

          {/* Center dot */}
          <div className="absolute bottom-[12px] left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-neutral-900" />

          {/* Needle */}
          <div
            className="absolute bottom-[20px] left-1/2 z-20 h-[2px] w-[140px] origin-left bg-violet-700"
            style={{
              transform: `translateX(0) translateY(0) rotate(${angle}deg)`,
            }}
          />
        </div>

        {/* Labels */}
        <div className="mt-2 flex items-center justify-between text-sm font-medium text-neutral-700">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}
