import content from "../data/content_posts.json";
import sales from "../data/daily_sales.json";
import { buildDayRows, bucketInsights } from "./lib/analytics";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Home() {
  const posts = (content as { posts: any[] }).posts;
  const dailySales = (sales as { daily_sales: any[] }).daily_sales;
  

  const rows = buildDayRows(posts, dailySales);

  // Content-type insights (based on revenue 24–48h after posting day)
  const reel = bucketInsights(rows, (r) => r.reelCount > 0, "Instagram Reels day");
  const story = bucketInsights(rows, (r) => r.storyCount > 0, "Instagram Stories day");
  const post = bucketInsights(rows, (r) => r.postCount > 0, "Instagram Static Post day");
  const tiktok = bucketInsights(rows, (r) => r.ttCount > 0, "TikTok Video day");

  const insights = [tiktok, reel, post, story].sort((a, b) => b.liftPct - a.liftPct);

  const barData = [
    { name: "TikTok video", lift: Number(tiktok.liftPct.toFixed(1)), avg: Number(tiktok.avgLagRevenue.toFixed(0)) },
    { name: "IG reel", lift: Number(reel.liftPct.toFixed(1)), avg: Number(reel.avgLagRevenue.toFixed(0)) },
    { name: "IG post", lift: Number(post.liftPct.toFixed(1)), avg: Number(post.avgLagRevenue.toFixed(0)) },
    { name: "IG story", lift: Number(story.liftPct.toFixed(1)), avg: Number(story.avgLagRevenue.toFixed(0)) },
  ];

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Creator Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Patterns only (no direct attribution). Revenue tends to lag content by 24–48h, so we compare posting days to
          sales 1–2 days later.
        </p>
      </header>

      {/* Top insights */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.slice(0, 3).map((i) => (
          <div key={i.label} className="rounded-2xl border p-4 shadow-sm">
            <div className="text-sm text-gray-500">Top insight</div>
            <div className="mt-1 text-lg font-semibold">{i.label}</div>
            <div className="mt-2 text-2xl font-bold">
              {i.liftPct >= 0 ? "+" : ""}
              {i.liftPct.toFixed(1)}%
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Avg revenue 1–2 days after: <span className="font-medium">£{i.avgLagRevenue.toFixed(0)}</span> (baseline: £
              {i.baselineLagRevenue.toFixed(0)})
            </div>
            <div className="mt-1 text-xs text-gray-500">Days with data: {i.days}</div>
          </div>
        ))}
      </section>

      {/* Line chart: revenue over time */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Revenue over time</h2>
        <p className="mt-1 text-sm text-gray-600">Use this to visually spot lagged spikes after posting activity.</p>

        <div className="mt-4 h-72 rounded-2xl border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" />
              <Line type="monotone" dataKey="postsCount" />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-3 text-xs text-gray-500">
            Lines shown: daily revenue (£) and number of posts that day (count).
          </p>
        </div>
      </section>

      {/* Bar chart: lift by format */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Which content format correlates with higher sales?</h2>
        <p className="mt-1 text-sm text-gray-600">Lift vs baseline, using average revenue 1–2 days after posting.</p>

        <div className="mt-4 h-72 rounded-2xl border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="lift" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 text-xs text-gray-500">Bar value: % lift in revenue (24–48h later) vs baseline.</p>
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-10 rounded-2xl border p-5 bg-gray-50">
        <h2 className="text-xl font-semibold">What Dan should do more of</h2>
        <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
          <li>Prioritise the top-performing format (based on lift above), and post it consistently.</li>
          <li>Use Stories mainly for engagement/retention; treat them as lower-conversion support content.</li>
          <li>Keep testing: repeat this view weekly as new data comes in (patterns strengthen with more days).</li>
        </ul>
      </section>
    </main>
  );
}
