"use client";

import React, { useMemo } from "react";

type Platform = "instagram" | "tiktok";
type PostType = "reel" | "story" | "post" | "video";

type Post = {
  id: string;
  platform: Platform;
  type: PostType;
  published_at: string;
  title?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
};

type LiftRow = {
  key: "tiktok" | "reel" | "story" | "post";
  label: string;
  postedDays: number;
  baselineAFR: number;
  avgAFRPosted: number;
  liftPct: number;
};

function mean(nums: number[]) {
  const cleaned = nums.filter((n) => Number.isFinite(n));
  if (cleaned.length === 0) return 0;
  return cleaned.reduce((a, b) => a + b, 0) / cleaned.length;
}

function formatGBP(n: number) {
  return `£${(Math.round(n * 10) / 10).toLocaleString("en-GB")}`;
}

function pct(n: number) {
  const sign = n > 0 ? "+" : "";
  // Keep one decimal like your screenshot (15.5%)
  const rounded = Math.round(n * 10) / 10;
  return `${sign}${rounded}%`;
}

export default function SummaryTable({
  posts,
  lifts,
}: {
  posts?: Post[];      // <-- optional to prevent crashes
  lifts?: LiftRow[];   // <-- optional
}) {
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeLifts = Array.isArray(lifts) ? lifts : [];

  const liftByKey = useMemo(() => {
    const m = new Map<string, LiftRow>();
    for (const l of safeLifts) m.set(l.key, l);
    return m;
  }, [safeLifts]);

  const rows = useMemo(() => {
    // Reach Index per post (NO SAVES)
    const reachIndexForPost = (p: Post) =>
      (p.views ?? 0) + (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);

    const igPosts = safePosts.filter((p) => p.platform === "instagram" && p.type === "post");
    const igReels = safePosts.filter((p) => p.platform === "instagram" && p.type === "reel");
    const igStories = safePosts.filter((p) => p.platform === "instagram" && p.type === "story");
    const ttVideos = safePosts.filter((p) => p.platform === "tiktok" && p.type === "video");

    const avgReach = {
      post: mean(igPosts.map(reachIndexForPost)),
      reel: mean(igReels.map(reachIndexForPost)),
      story: mean(igStories.map(reachIndexForPost)),
      tiktok: mean(ttVideos.map(reachIndexForPost)),
    };

    const lookup = (key: LiftRow["key"]) => liftByKey.get(key);

    return [
      {
        key: "post" as const,
        label: "IG Static posts",
        avgReachIndex: avgReach.post,
        afr: lookup("post")?.avgAFRPosted ?? 0,
        liftPct: lookup("post")?.liftPct ?? 0,
      },
      {
        key: "reel" as const,
        label: "IG Reels",
        avgReachIndex: avgReach.reel,
        afr: lookup("reel")?.avgAFRPosted ?? 0,
        liftPct: lookup("reel")?.liftPct ?? 0,
      },
      {
        key: "story" as const,
        label: "IG Stories",
        avgReachIndex: avgReach.story,
        afr: lookup("story")?.avgAFRPosted ?? 0,
        liftPct: lookup("story")?.liftPct ?? 0,
      },
      {
        key: "tiktok" as const,
        label: "TikTok videos",
        avgReachIndex: avgReach.tiktok,
        afr: lookup("tiktok")?.avgAFRPosted ?? 0,
        liftPct: lookup("tiktok")?.liftPct ?? 0,
      },
    ];
  }, [safePosts, liftByKey]);

  const purple = "#7c3aed";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <div className="text-lg font-semibold text-neutral-900">Summary Table — Content Type Performance</div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
        <table className="w-full table-auto">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-semibold text-neutral-600">
              <th className="px-4 py-3">Content type</th>
              <th className="px-4 py-3">Avg Reach Index</th>
              <th className="px-4 py-3">Avg AFR (£, D+1 &amp; D+2)</th>
              <th className="px-4 py-3">Lift vs baseline</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-neutral-200 text-sm">
                <td className="px-4 py-4 font-semibold text-neutral-900">{r.label}</td>

                <td className="px-4 py-4 font-semibold" style={{ color: purple }}>
                  {Math.round(r.avgReachIndex).toLocaleString("en-GB")}
                </td>

                <td className="px-4 py-4 font-semibold" style={{ color: purple }}>
                  {formatGBP(r.afr)}
                </td>

                <td className="px-4 py-4 font-semibold" style={{ color: r.liftPct > 0 ? purple : "#111827" }}>
                  {pct(r.liftPct)}{" "}
                  {r.liftPct >= 10 ? <span className="ml-1">✅</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
