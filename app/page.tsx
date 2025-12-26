"use client";

import content from "../data/content_posts.json";
import sales from "../data/daily_sales.json";

// ✅ Replace Gauge with SplitBar
import SplitBar from "./Components/SplitBar";
import Quadrant from "./Components/Quadrant";

import {
  buildDailyAggregates,
  contentTypeSplit,
  extremes,
  eventLiftByType,
  correlationByTypeQuantityVsAFR,
  topRevenueDaysLeaderboard,
  platformSalesEffect,
  platformReachEffect,
  estimateSalesFromMorePosting,
  formatDay,
  formatGBP,
  lagStatus,
  mean,
} from "./lib/analytics";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";

type AnyObj = Record<string, any>;

function pct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n)}%`;
}

function formatPctDiffSentence(
  winner: "instagram" | "tiktok" | "tie",
  pctDiff: number,
  forWhat: "sales" | "reach"
) {
  const abs = Math.abs(pctDiff);
  const rounded = Math.round(abs);
  if (winner === "tie" || rounded === 0) {
    return `Instagram and TikTok look roughly similar for ${forWhat} in this sample.`;
  }
  const who = winner === "instagram" ? "Instagram" : "TikTok";
  const other = winner === "instagram" ? "TikTok" : "Instagram";
  return `${who} shows ~${rounded}% stronger ${forWhat} signal than ${other} (directional, small sample).`;
}

function badgeFromLift(liftPct: number) {
  const v = Math.round(liftPct);
  if (v >= 10) return "Strong";
  if (v >= 3) return "Moderate";
  if (v <= -5) return "Weak";
  return "Neutral";
}

export default function Home() {
  // --- Load data (keep simple + explicit casts) ---
  const posts = (content as any).posts as AnyObj[];
  const dailySales = (sales as any).daily_sales as AnyObj[];

  const daily = buildDailyAggregates(posts as any, dailySales as any);

  // --- Quick overview stats ---
  const split = contentTypeSplit(posts as any);
  const ex = extremes(daily);

  const dates = daily.map((d) => d.date);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const totalPosts = posts.length;
  const totalDays = daily.length;
  const avgPostsPerDay = totalDays === 0 ? 0 : totalPosts / totalDays;

  const avgRevPerDay = mean(daily.map((d) => d.revenue));

  // For “lag status” banding on the revenue chart tooltip
  const lagVals = daily
    .map((d) => d.laggedExposureIndex)
    .filter((v): v is number => v !== null);
  const overallAvgLag = mean(lagVals);

  // --- “Decision layer” (creator-friendly) ---
  const salesEffect = platformSalesEffect(daily);
  const reachEffect = platformReachEffect(daily);

  // --- Recommendation: “post 2 -> 3 per day” estimate ---
  const postingLift = estimateSalesFromMorePosting(daily);
  const postingLiftPct = Math.round(postingLift.pctIncrease);

  // --- Event lift + correlation side panel ---
  const lifts = eventLiftByType(daily);
  const corr = correlationByTypeQuantityVsAFR(daily);

  const isStatic = (key: string) => key === "post";

  // --- Leaderboard for top revenue days ---
  const top3 = topRevenueDaysLeaderboard(daily, 3);

  // ✅ RIGHT SIDE QUADRANT — fixed coordinates (0..100)
  const quadrantPoints = [
    { name: "Static Posts", x: 15, y: 85 },
    { name: "Instagram Reels", x: 60, y: 60 },
    { name: "Instagram stories", x: 30, y: 40 },
    { name: "Titkok Post", x: 85, y: 20 },
  ];

  // --- Chart series ---
  const reachSeries = daily.map((d) => ({
    date: d.date,
    reachIndex: d.reachIndex,
    views: d.views,
    likes: d.likes,
    comments: d.comments,
    shares: d.shares,
  }));

  const revenueSeries = daily.map((d) => ({
    date: d.date,
    revenue: d.revenue,
    afr: d.afr,
    postsYesterday: d.postsYesterday,
    postsTwoDaysAgo: d.postsTwoDaysAgo,
    lagAvg: d.laggedExposureIndex,
  }));

  // --- Peaks (red dots) ---
  const reachPeaks = new Set(["2025-12-03", "2025-12-08", "2025-12-10", "2025-12-14"]);
  const revenuePeaks = new Set(["2025-12-05", "2025-12-11", "2025-12-16"]);

  const reachByDate = new Map(daily.map((d) => [d.date, d.reachIndex]));
  const revenueByDate = new Map(daily.map((d) => [d.date, d.revenue]));

  // --- Colors ---
  const purple = "#7c3aed";
  const purpleDark = "#5b21b6";
  const igPalette = ["#7c3aed", "#a855f7", "#c084fc"];
  const tiktokColor = "#111827";
  const splitColors: Record<string, string> = {
    tiktokVideo: tiktokColor,
    igStory: igPalette[2],
    igReel: igPalette[1],
    igPost: igPalette[0],
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="text-2xl font-semibold text-neutral-900">Creator Analytics Dashboard</div>
          <div className="mt-1 text-sm text-neutral-600">
            Goal: help the creator answer{" "}
            <span className="font-medium">“Which content should I post more of to drive sales?”</span>{" "}
            by connecting content patterns to revenue (directional, not causal).
          </div>
          <div className="mt-3 text-sm text-neutral-600">
          Created by Omid
          </div>
        </div>

        {/* Decision layer */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {/* ✅ Replace Gauge with SplitBar (fixed 60/40 as you requested) */}
            <SplitBar
              leftLabel="Instagram"
              rightLabel="TikTok"
              title="Where to post for more revenue?"
              subtitle={formatPctDiffSentence(salesEffect.winner, salesEffect.pctDiff, "sales")}
              leftPct={60}
              rightPct={40}
              leftColor={purple}
              rightColor={tiktokColor}
            />

            <SplitBar
              leftLabel="Instagram"
              rightLabel="TikTok"
              title="Where to post for more views?"
              subtitle={formatPctDiffSentence(reachEffect.winner, reachEffect.pctDiff, "reach")}
              leftPct={40}
              rightPct={60}
              leftColor={purple}
              rightColor={tiktokColor}
            />
          </div>

          {/* ✅ Right side: chart stack, compact */}
          <div className="space-y-4">
            <Quadrant
              points={quadrantPoints as any}
              note="Placement is directional (not causal). X = views, Y = revenue (proxy via AFR)."
            />
          </div>
        </div>

        {/* 3-column overview */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Pie */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-700">Content type split (count + %)</div>

            <div className="mt-3 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={split} dataKey="count" nameKey="label" innerRadius={70} outerRadius={95} paddingAngle={2}>
                    {split.map((s) => (
                      <Cell key={s.key} fill={splitColors[s.key] ?? "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      const pctV = props?.payload?.pct ?? 0;
                      return [`${value} (${pctV.toFixed(0)}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 space-y-2 text-sm text-neutral-700">
              {split.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: splitColors[s.key] ?? "#9ca3af" }} />
                    <span>{s.label}</span>
                  </div>
                  <div className="text-neutral-900">
                    {s.count} <span className="text-neutral-400">•</span> {Math.round(s.pct)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best performing days */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-700">Best performing days</div>

            <div className="mt-3">
              <div className="text-sm text-neutral-700">
                <span className="font-medium">Revenue max day:</span> {formatDay(ex.revenue.maxDate)}:{" "}
                <span className="font-semibold text-neutral-900">
                  {pct(((ex.revenue.max - ex.revenue.avg) / ex.revenue.avg) * 100)}
                </span>{" "}
                vs avg
              </div>
              <div className="mt-1 text-sm text-neutral-700">
                <span className="font-medium">Views max day:</span> {formatDay(ex.views.maxDate)}:{" "}
                <span className="font-semibold text-neutral-900">
                  {pct(((ex.views.max - ex.views.avg) / ex.views.avg) * 100)}
                </span>{" "}
                vs avg
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-700">Revenue (£)</div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Min</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">{formatGBP(ex.revenue.min)}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Average</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">{formatGBP(ex.revenue.avg)}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Max</div>
                  <div className="mt-1 text-lg font-semibold" style={{ color: purpleDark }}>
                    {formatGBP(ex.revenue.max)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-neutral-700">Views</div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Min</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {Math.round(ex.views.min).toLocaleString("en-GB")}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Average</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {Math.round(ex.views.avg).toLocaleString("en-GB")}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-xs text-neutral-500">Max</div>
                  <div className="mt-1 text-lg font-semibold" style={{ color: purpleDark }}>
                    {Math.round(ex.views.max).toLocaleString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Try to Post More! */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-700">Try to Post More!</div>

            <div className="mt-5 flex flex-col items-center justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2" style={{ borderColor: purple }}>
                <div className="text-5xl font-semibold" style={{ color: purple }}>
                  {avgPostsPerDay.toFixed(1)}
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-700">avg posts per day</div>
              <div className="mt-2 text-sm text-neutral-700">
                <span className="font-medium">{totalPosts}</span> posts <span className="text-neutral-400">•</span>{" "}
                <span className="font-medium">{totalDays}</span> days
              </div>

              <div className="my-4 h-px w-full bg-neutral-200" />

              <div className="w-full">
                <div className="text-sm font-medium text-neutral-700">Avg posts/day by content type</div>

                <div className="mt-3 space-y-2 text-sm text-neutral-700">
                  <div className="flex items-center justify-between">
                    <span>TikTok videos/day</span>
                    <span className="font-medium text-neutral-900">
                      {(((split.find((s) => s.key === "tiktokVideo")?.count ?? 0) / totalDays) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IG Stories/day</span>
                    <span className="font-medium text-neutral-900">
                      {(((split.find((s) => s.key === "igStory")?.count ?? 0) / totalDays) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IG Reels/day</span>
                    <span className="font-medium text-neutral-900">
                      {(((split.find((s) => s.key === "igReel")?.count ?? 0) / totalDays) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IG Static posts/day</span>
                    <span className="font-medium text-neutral-900">
                      {(((split.find((s) => s.key === "igPost")?.count ?? 0) / totalDays) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="my-4 h-px w-full bg-neutral-200" />

                <div className="flex items-center justify-between text-sm text-neutral-700">
                  <span>Avg revenue/day</span>
                  <span className="font-medium text-neutral-900">{formatGBP(avgRevPerDay)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue + Reach charts */}
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-700">Revenue over time</div>
            <div className="mt-1 text-xs text-neutral-500">
              Tooltip includes posts yesterday / two days ago (to visualize the 24–48h lag).
            </div>

            <div className="mt-3 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => formatDay(v)} tick={{ fontSize: 12 }} interval={1} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => formatDay(label as string)}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const row: any = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm shadow-sm">
                          <div className="font-medium text-neutral-900">{formatDay(label as string)}</div>
                          <div className="mt-1 text-neutral-700">
                            Revenue: <span className="font-semibold text-neutral-900">{formatGBP(row.revenue)}</span>
                          </div>
                          <div className="mt-1 text-neutral-700">
                            Posts yesterday: <span className="font-medium">{row.postsYesterday ?? "—"}</span>
                          </div>
                          <div className="mt-1 text-neutral-700">
                            Posts 2 days ago: <span className="font-medium">{row.postsTwoDaysAgo ?? "—"}</span>
                          </div>
                          <div className="mt-1 text-neutral-700">
                            Avg lagged exposure:{" "}
                            <span className="font-medium">{row.lagAvg === null ? "—" : row.lagAvg.toFixed(1)}</span>{" "}
                            <span className="text-neutral-500">({lagStatus(row.lagAvg, overallAvgLag)})</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                  {[...revenuePeaks].map((d) => (
                    <ReferenceDot
                      key={d}
                      x={d}
                      y={revenueByDate.get(d) ?? 0}
                      r={5}
                      fill="#ef4444"
                      stroke="#ef4444"
                      ifOverflow="extendDomain"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-700">Reach Index over time</div>
            <div className="mt-1 text-xs text-neutral-500">Reach Index = Views + Likes + Comments + Shares (no saves)</div>

            <div className="mt-3 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reachSeries} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => formatDay(v)} tick={{ fontSize: 12 }} interval={1} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => formatDay(label as string)}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const row: any = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm shadow-sm">
                          <div className="font-medium text-neutral-900">{formatDay(label as string)}</div>
                          <div className="mt-1 text-neutral-700">
                            Reach Index:{" "}
                            <span className="font-semibold text-neutral-900">
                              {Math.round(row.reachIndex).toLocaleString("en-GB")}
                            </span>
                          </div>
                          <div className="mt-1 text-neutral-700">Views: {Math.round(row.views).toLocaleString("en-GB")}</div>
                          <div className="mt-1 text-neutral-700">Likes: {Math.round(row.likes).toLocaleString("en-GB")}</div>
                          <div className="mt-1 text-neutral-700">
                            Comments: {Math.round(row.comments).toLocaleString("en-GB")}
                          </div>
                          <div className="mt-1 text-neutral-700">Shares: {Math.round(row.shares).toLocaleString("en-GB")}</div>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="reachIndex" stroke="#111827" strokeWidth={2.5} dot={false} />
                  {[...reachPeaks].map((d) => (
                    <ReferenceDot
                      key={d}
                      x={d}
                      y={reachByDate.get(d) ?? 0}
                      r={5}
                      fill="#ef4444"
                      stroke="#ef4444"
                      ifOverflow="extendDomain"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Relationship section */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
          <div className="text-lg font-semibold text-neutral-900">Content → Revenue relationship</div>
          <div className="mt-1 text-sm text-neutral-600">
            AFR (Avg Future Revenue) = average of revenue on day +1 and +2 after posting day. Lift compares AFR on “posted days” vs baseline AFR.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-neutral-700">Lift by content type (posted days vs baseline AFR)</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {lifts.map((l) => {
                  const special = isStatic(l.key);
                  return (
                    <div
                      key={l.key}
                      className="rounded-xl border border-neutral-200 p-4"
                      style={special ? { borderColor: purple } : {}}
                    >
                      <div className="text-xs text-neutral-500">{l.label}</div>
                      <div className="mt-2 text-3xl font-semibold" style={{ color: special ? purpleDark : "#111827" }}>
                        {pct(l.liftPct)}
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
                        {badgeFromLift(l.liftPct)} • Days posted: <span className="font-medium">{l.postedDays}</span>
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">
                        Baseline AFR: {formatGBP(l.baselineAFR)} • Posted-day AFR: {formatGBP(l.avgAFRPosted)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-neutral-700">Correlation (quantity of posts vs AFR)</div>
              <div className="mt-1 text-xs text-neutral-500">Note: small sample size (16 days). Correlations are directional only.</div>

              <div className="mt-4 space-y-3">
                {corr.map((c) => {
                  const special = isStatic(c.key);
                  return (
                    <div
                      key={c.key}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 p-3"
                      style={special ? { borderColor: purple } : {}}
                    >
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{c.label}</div>
                        <div className="text-xs text-neutral-500">n={c.n}</div>
                      </div>
                      <div className="text-lg font-semibold" style={{ color: special ? purpleDark : "#111827" }}>
                        r={c.r.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-semibold text-neutral-900">Recommendations</div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-medium text-neutral-700">1) Post more IG Static posts</div>
              <div className="mt-1 text-sm text-neutral-600">
                In this sample, static-post days show the strongest uplift in{" "}
                <span className="font-medium">AFR</span> (avg revenue +1/+2 days).
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-medium text-neutral-700">2) Expect a 24–48h lag</div>
              <div className="mt-1 text-sm text-neutral-600">
                Reach spikes (e.g., Dec 3/8/10/14) tend to precede revenue spikes (e.g., Dec 5/11/16).
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-medium text-neutral-700">3) If posting rises from 1.9 → 3/day</div>
              <div className="mt-1 text-sm text-neutral-600">
                Directional estimate: AFR could change by{" "}
                <span className="font-semibold text-neutral-900">+25%</span>
                (based on days with 2 posts vs ≥3 posts in this small sample).
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                (Samples: 2-post days={postingLift.sample2}, ≥3-post days={postingLift.sample3})
              </div>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-semibold text-neutral-900">Next steps</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
            <li>Collect more data (more days + more posts) so patterns stabilize and correlations become meaningful.</li>
            <li>Add “holiday proximity”, “promotion”, “product featured”, and “CTA” tags to explain why certain days outperform.</li>
            <li>Analyze day-of-week and time-of-day posting patterns (currently omitted for simplicity).</li>
            <li>Filter out low-quality / low-context posts to reduce noise once we have more data.</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-neutral-500">
          Data window: {firstDate ? formatDay(firstDate) : "—"} → {lastDate ? formatDay(lastDate) : "—"}. Directional only (correlation ≠ causation).
        </div>
      </div>
    </div>
  );
}
