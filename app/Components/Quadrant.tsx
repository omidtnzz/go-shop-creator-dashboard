"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  ReferenceLine,
  Tooltip,
  LabelList,
} from "recharts";

type Point = {
  name: string;
  x: number; // 0..100
  y: number; // 0..100
};

export default function Quadrant({
  points,
}: {
  points: Point[];
  note: string; // keep prop signature compatible, but we won’t render it
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-neutral-700">
        Which content type to post?
      </div>
      <div className="mt-1 text-xs text-neutral-500">
        X = reach index (scaled), Y = revenue lift proxy via AFR (scaled).
      </div>

      {/* ✅ overlay labels so they never get clipped by Recharts */}
      <div className="relative mt-4 h-[320px]">
        {/* Y-axis hints (overlay) */}
        <div className="pointer-events-none absolute left-0 top-5 text-sm text-neutral-500">
          <span className="font-medium">More revenue</span> ↑
        </div>
        <div className="pointer-events-none absolute left-0 bottom-8 text-sm text-neutral-500">
          <span className="font-medium">Less revenue</span> ↓
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 14, right: 18, bottom: 34, left: 42 }}>
            <CartesianGrid strokeDasharray="3 3" />

            {/* Middle cross */}
            <ReferenceLine x={50} stroke="#9ca3af" />
            <ReferenceLine y={50} stroke="#9ca3af" />

            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              tick={false}
              axisLine
              label={{
                value: "Less views  ←→  More views",
                position: "bottom",
                offset: 12,
              }}
            />

            <YAxis type="number" dataKey="y" domain={[0, 100]} tick={false} axisLine />

            <Tooltip
              formatter={(value: any, name: any) => [value, name]}
              labelFormatter={() => ""}
              contentStyle={{ borderRadius: 12 }}
            />

            <Scatter data={points} fill="#6d28d9">
              <LabelList
                dataKey="name"
                position="top"
                offset={10}
                style={{ fontSize: 12, fontWeight: 700, fill: "#111827" }}
              />
            </Scatter>

            {/* Bigger dots */}
            <Scatter
              data={points}
              shape={(p: any) => (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={7}
                  fill="#6d28d9"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
