export type Platform = "instagram" | "tiktok";
export type PostType = "reel" | "story" | "post" | "video";

export type Post = {
  id: string;
  platform: Platform;
  type: PostType;
  published_at: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export type DailySale = {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  units_sold: Record<string, number>;
};

export type DayAgg = {
  date: string;

  postsCount: number;
  igCount: number;
  ttCount: number;

  reelCount: number;
  storyCount: number;
  postCount: number;
  videoCount: number;

  views: number;
  likes: number;
  comments: number;
  shares: number;

  reachIndex: number; // views+likes+comments+shares (no saves)

  revenue: number;
  orders: number;

  postsYesterday: number | null;
  postsTwoDaysAgo: number | null;
  laggedExposureIndex: number | null;

  revenuePlus1: number | null;
  revenuePlus2: number | null;
  afr: number | null; // Avg Future Revenue = avg(rev+1, rev+2)
};

export function toDateKeyUTC(iso: string) {
  return iso.slice(0, 10);
}

export function addDays(dateKey: string, days: number) {
  const d = new Date(dateKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatGBP(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export function formatDay(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export function mean(nums: number[]) {
  const cleaned = nums.filter((n) => Number.isFinite(n));
  if (cleaned.length === 0) return 0;
  return cleaned.reduce((a, b) => a + b, 0) / cleaned.length;
}

export function pearsonCorrelation(x: number[], y: number[]) {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const xi = x[i];
    const yi = y[i];
    if (Number.isFinite(xi) && Number.isFinite(yi)) pairs.push([xi, yi]);
  }
  const n = pairs.length;
  if (n < 3) return { r: 0, n };

  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);

  const mx = mean(xs);
  const my = mean(ys);

  let num = 0;
  let dx = 0;
  let dy = 0;

  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }

  const den = Math.sqrt(dx * dy);
  if (den === 0) return { r: 0, n };
  return { r: num / den, n };
}

function postReachIndex(p: Post) {
  // IMPORTANT: reach index excludes saves by design
  return (p.views ?? 0) + (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
}

export function buildDailyAggregates(posts: Post[], sales: DailySale[]): DayAgg[] {
  const postsByDate = new Map<string, Post[]>();
  for (const p of posts) {
    const d = toDateKeyUTC(p.published_at);
    const arr = postsByDate.get(d) ?? [];
    arr.push(p);
    postsByDate.set(d, arr);
  }

  const salesByDate = new Map<string, DailySale>();
  for (const s of sales) salesByDate.set(s.date, s);

  const dates = sales.map((s) => s.date).sort();

  const agg: DayAgg[] = dates.map((date) => {
    const dayPosts = postsByDate.get(date) ?? [];
    const s = salesByDate.get(date)!;

    const igCount = dayPosts.filter((p) => p.platform === "instagram").length;
    const ttCount = dayPosts.filter((p) => p.platform === "tiktok").length;

    const reelCount = dayPosts.filter((p) => p.type === "reel").length;
    const storyCount = dayPosts.filter((p) => p.type === "story").length;
    const postCount = dayPosts.filter((p) => p.type === "post").length;
    const videoCount = dayPosts.filter((p) => p.type === "video").length;

    const views = dayPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const likes = dayPosts.reduce((sum, p) => sum + (p.likes ?? 0), 0);
    const comments = dayPosts.reduce((sum, p) => sum + (p.comments ?? 0), 0);
    const shares = dayPosts.reduce((sum, p) => sum + (p.shares ?? 0), 0);

    const reachIndex = views + likes + comments + shares;

    const d1 = addDays(date, 1);
    const d2 = addDays(date, 2);
    const r1 = salesByDate.has(d1) ? salesByDate.get(d1)!.revenue : null;
    const r2 = salesByDate.has(d2) ? salesByDate.get(d2)!.revenue : null;

    let afr: number | null = null;
    if (r1 !== null && r2 !== null) afr = (r1 + r2) / 2;
    else if (r1 !== null) afr = r1;
    else if (r2 !== null) afr = r2;

    return {
      date,
      postsCount: dayPosts.length,
      igCount,
      ttCount,
      reelCount,
      storyCount,
      postCount,
      videoCount,
      views,
      likes,
      comments,
      shares,
      reachIndex,
      revenue: s.revenue,
      orders: s.orders,
      postsYesterday: null,
      postsTwoDaysAgo: null,
      laggedExposureIndex: null,
      revenuePlus1: r1,
      revenuePlus2: r2,
      afr,
    };
  });

  const postsCountByDate = new Map<string, number>();
  for (const date of dates) postsCountByDate.set(date, (postsByDate.get(date) ?? []).length);

  for (const row of agg) {
    const y = addDays(row.date, -1);
    const d2 = addDays(row.date, -2);

    const py = postsCountByDate.has(y) ? postsCountByDate.get(y)! : null;
    const p2 = postsCountByDate.has(d2) ? postsCountByDate.get(d2)! : null;

    row.postsYesterday = py;
    row.postsTwoDaysAgo = p2;

    if (py !== null && p2 !== null) row.laggedExposureIndex = (py + p2) / 2;
    else if (py !== null) row.laggedExposureIndex = py;
    else if (p2 !== null) row.laggedExposureIndex = p2;
    else row.laggedExposureIndex = null;
  }

  return agg;
}

export function contentTypeSplit(posts: Post[]) {
  const counts = { tiktokVideo: 0, igStory: 0, igReel: 0, igPost: 0 };

  for (const p of posts) {
    if (p.platform === "tiktok" && p.type === "video") counts.tiktokVideo += 1;
    if (p.platform === "instagram" && p.type === "story") counts.igStory += 1;
    if (p.platform === "instagram" && p.type === "reel") counts.igReel += 1;
    if (p.platform === "instagram" && p.type === "post") counts.igPost += 1;
  }

  const total = posts.length;
  const toPct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return [
    { key: "tiktokVideo", label: "TikTok videos", count: counts.tiktokVideo, pct: toPct(counts.tiktokVideo) },
    { key: "igStory", label: "IG Stories", count: counts.igStory, pct: toPct(counts.igStory) },
    { key: "igReel", label: "IG Reels", count: counts.igReel, pct: toPct(counts.igReel) },
    { key: "igPost", label: "IG Static posts", count: counts.igPost, pct: toPct(counts.igPost) },
  ];
}

export function lagStatus(lagAvg: number | null, overallAvgLag: number) {
  if (lagAvg === null) return "—";
  const delta = lagAvg - overallAvgLag;
  const band = 0.25;
  if (delta > band) return "Above average";
  if (delta < -band) return "Below average";
  return "Average";
}

export function extremes(daily: DayAgg[]) {
  const viewsArr = daily.map((d) => d.views);
  const revenueArr = daily.map((d) => d.revenue);

  const avgViews = mean(viewsArr);
  const avgRevenue = mean(revenueArr);

  let maxViews = -Infinity,
    minViews = Infinity,
    maxViewsDate = daily[0]?.date ?? "",
    minViewsDate = daily[0]?.date ?? "";
  let maxRevenue = -Infinity,
    minRevenue = Infinity,
    maxRevenueDate = daily[0]?.date ?? "",
    minRevenueDate = daily[0]?.date ?? "";

  for (const d of daily) {
    if (d.views > maxViews) {
      maxViews = d.views;
      maxViewsDate = d.date;
    }
    if (d.views < minViews) {
      minViews = d.views;
      minViewsDate = d.date;
    }

    if (d.revenue > maxRevenue) {
      maxRevenue = d.revenue;
      maxRevenueDate = d.date;
    }
    if (d.revenue < minRevenue) {
      minRevenue = d.revenue;
      minRevenueDate = d.date;
    }
  }

  return {
    views: { avg: avgViews, min: minViews, max: maxViews, minDate: minViewsDate, maxDate: maxViewsDate },
    revenue: { avg: avgRevenue, min: minRevenue, max: maxRevenue, minDate: minRevenueDate, maxDate: maxRevenueDate },
  };
}

export function baselineAFR(daily: DayAgg[]) {
  const vals = daily.map((d) => d.afr).filter((v): v is number => v !== null);
  return mean(vals);
}

export type LiftRow = {
  key: "tiktok" | "reel" | "story" | "post";
  label: string;
  postedDays: number;
  baselineAFR: number;
  avgAFRPosted: number;
  liftPct: number;
};

export function eventLiftByType(daily: DayAgg[]): LiftRow[] {
  const baseline = baselineAFR(daily);

  const buckets: Array<{ key: LiftRow["key"]; label: string; pred: (d: DayAgg) => boolean }> = [
    { key: "post", label: "IG Static posts", pred: (d) => d.postCount > 0 },
    { key: "reel", label: "IG Reels", pred: (d) => d.reelCount > 0 },
    { key: "story", label: "IG Stories", pred: (d) => d.storyCount > 0 },
    { key: "tiktok", label: "TikTok videos", pred: (d) => d.videoCount > 0 },
  ];

  return buckets.map((b) => {
    const vals = daily.filter(b.pred).map((d) => d.afr).filter((v): v is number => v !== null);
    const avg = mean(vals);
    const liftPct = baseline === 0 ? 0 : ((avg - baseline) / baseline) * 100;
    return { key: b.key, label: b.label, postedDays: vals.length, baselineAFR: baseline, avgAFRPosted: avg, liftPct };
  });
}

export type CorrRow = {
  key: "tiktok" | "reel" | "story" | "post";
  label: string;
  r: number;
  n: number;
};

export function correlationByTypeQuantityVsAFR(daily: DayAgg[]): CorrRow[] {
  const rows: Array<{ key: CorrRow["key"]; label: string; pick: (d: DayAgg) => number }> = [
    { key: "post", label: "IG Static posts", pick: (d) => d.postCount },
    { key: "reel", label: "IG Reels", pick: (d) => d.reelCount },
    { key: "story", label: "IG Stories", pick: (d) => d.storyCount },
    { key: "tiktok", label: "TikTok videos", pick: (d) => d.videoCount },
  ];

  return rows.map((r) => {
    const x: number[] = [];
    const y: number[] = [];
    for (const d of daily) {
      if (d.afr === null) continue;
      x.push(r.pick(d));
      y.push(d.afr);
    }
    const out = pearsonCorrelation(x, y);
    return { key: r.key, label: r.label, r: out.r, n: out.n };
  });
}

export type TopRevenueRow = {
  rank: 1 | 2 | 3;
  date: string;
  dateLabel: string;
  revenue: number;
  revenueDeltaPct: number;
  reachPast2Days: number; // D-1 + D-2 reachIndex
  formatsPast2Days: {
    reels: number;
    stories: number;
    posts: number;
    tiktok: number;
    totalPosts: number;
  };
};

export function topRevenueDaysLeaderboard(daily: DayAgg[], topN = 3): TopRevenueRow[] {
  const avgRevenue = mean(daily.map((d) => d.revenue));
  const byDate = new Map<string, DayAgg>();
  for (const d of daily) byDate.set(d.date, d);

  const sorted = [...daily].sort((a, b) => b.revenue - a.revenue).slice(0, topN);

  return sorted.map((d, idx) => {
    const d1 = addDays(d.date, -1);
    const d2 = addDays(d.date, -2);

    const p1 = byDate.get(d1);
    const p2 = byDate.get(d2);

    const reachPast2Days = (p1?.reachIndex ?? 0) + (p2?.reachIndex ?? 0);

    const reels = (p1?.reelCount ?? 0) + (p2?.reelCount ?? 0);
    const stories = (p1?.storyCount ?? 0) + (p2?.storyCount ?? 0);
    const posts = (p1?.postCount ?? 0) + (p2?.postCount ?? 0);
    const tiktok = (p1?.videoCount ?? 0) + (p2?.videoCount ?? 0);
    const totalPosts = reels + stories + posts + tiktok;

    const revenueDeltaPct = avgRevenue === 0 ? 0 : ((d.revenue - avgRevenue) / avgRevenue) * 100;

    return {
      rank: (idx + 1) as 1 | 2 | 3,
      date: d.date,
      dateLabel: formatDay(d.date),
      revenue: d.revenue,
      revenueDeltaPct,
      reachPast2Days,
      formatsPast2Days: { reels, stories, posts, tiktok, totalPosts },
    };
  });
}

/** Creator-friendly platform comparison:
 * "Sales effect" is based on AFR average on days with IG posts vs days with TikTok posts.
 */
export function platformSalesEffect(daily: DayAgg[]) {
  const igAFR = daily.filter((d) => d.igCount > 0 && d.afr !== null).map((d) => d.afr as number);
  const ttAFR = daily.filter((d) => d.ttCount > 0 && d.afr !== null).map((d) => d.afr as number);

  const ig = mean(igAFR);
  const tt = mean(ttAFR);

  if (ig === 0 && tt === 0) return { ig, tt, pctDiff: 0, winner: "tie" as const };
  if (tt === 0) return { ig, tt, pctDiff: 100, winner: "instagram" as const };
  if (ig === 0) return { ig, tt, pctDiff: -100, winner: "tiktok" as const };

  const pctDiff = ((ig - tt) / Math.abs(tt)) * 100;
  const winner = pctDiff > 0 ? ("instagram" as const) : pctDiff < 0 ? ("tiktok" as const) : ("tie" as const);
  return { ig, tt, pctDiff, winner };
}

/** Creator-friendly reach comparison:
 * compares avg daily Reach Index on days with IG posts vs days with TikTok posts.
 */
export function platformReachEffect(daily: DayAgg[]) {
  const igReach = daily.filter((d) => d.igCount > 0).map((d) => d.reachIndex);
  const ttReach = daily.filter((d) => d.ttCount > 0).map((d) => d.reachIndex);

  const ig = mean(igReach);
  const tt = mean(ttReach);

  if (ig === 0 && tt === 0) return { ig, tt, pctDiff: 0, winner: "tie" as const };
  if (tt === 0) return { ig, tt, pctDiff: 100, winner: "instagram" as const };
  if (ig === 0) return { ig, tt, pctDiff: -100, winner: "tiktok" as const };

  const pctDiff = ((ig - tt) / Math.abs(tt)) * 100;
  const winner = pctDiff > 0 ? ("instagram" as const) : pctDiff < 0 ? ("tiktok" as const) : ("tie" as const);
  return { ig, tt, pctDiff, winner };
}

/** Simple estimate: if avg posts/day moves from ~2 -> ~3, what happens to AFR?
 * Uses observed AFR by post-count bucket.
 */
export function estimateSalesFromMorePosting(daily: DayAgg[]) {
  const afr2 = daily.filter((d) => d.postsCount === 2 && d.afr !== null).map((d) => d.afr as number);
  const afr3 = daily.filter((d) => d.postsCount >= 3 && d.afr !== null).map((d) => d.afr as number);

  const avg2 = mean(afr2);
  const avg3 = mean(afr3);

  // fallback if missing buckets
  const baseline = baselineAFR(daily);

  const from = avg2 || baseline;
  const to = avg3 || baseline;

  const pct = from === 0 ? 0 : ((to - from) / from) * 100;

  return {
    fromAFR: from,
    toAFR: to,
    pctIncrease: pct,
    sample2: afr2.length,
    sample3: afr3.length,
  };
}

/**
 * Summary table helper (proper Reach Index per content type):
 * - Reach Index is computed PER POST: views+likes+comments+shares (no saves)
 * - Avg AFR is computed on days where that content type was posted
 */
export type SummaryByTypeRow = {
  key: "post" | "reel" | "story" | "tiktok";
  label: string;
  avgReachIndex: number; // per post average reach index
  avgAFR: number; // avg AFR on days posted
  liftVsBaselinePct: number;
  postedDays: number;
  postCount: number;
};

export function summaryByType(posts: Post[], sales: DailySale[]) {
  const daily = buildDailyAggregates(posts, sales);
  const baseline = baselineAFR(daily);

  const defs: Array<{
    key: SummaryByTypeRow["key"];
    label: string;
    postPred: (p: Post) => boolean;
    dayPred: (d: DayAgg) => boolean;
  }> = [
    {
      key: "post",
      label: "IG Static posts",
      postPred: (p) => p.platform === "instagram" && p.type === "post",
      dayPred: (d) => d.postCount > 0,
    },
    {
      key: "reel",
      label: "IG Reels",
      postPred: (p) => p.platform === "instagram" && p.type === "reel",
      dayPred: (d) => d.reelCount > 0,
    },
    {
      key: "story",
      label: "IG Stories",
      postPred: (p) => p.platform === "instagram" && p.type === "story",
      dayPred: (d) => d.storyCount > 0,
    },
    {
      key: "tiktok",
      label: "TikTok videos",
      postPred: (p) => p.platform === "tiktok" && p.type === "video",
      dayPred: (d) => d.videoCount > 0,
    },
  ];

  return defs.map((def) => {
    const matchingPosts = posts.filter(def.postPred);
    const postCount = matchingPosts.length;

    const avgReachIndex =
      postCount === 0 ? 0 : mean(matchingPosts.map((p) => postReachIndex(p)));

    const afrVals = daily
      .filter(def.dayPred)
      .map((d) => d.afr)
      .filter((v): v is number => v !== null);

    const avgAFR = mean(afrVals);
    const liftVsBaselinePct = baseline === 0 ? 0 : ((avgAFR - baseline) / baseline) * 100;

    return {
      key: def.key,
      label: def.label,
      avgReachIndex,
      avgAFR,
      liftVsBaselinePct,
      postedDays: afrVals.length,
      postCount,
    } satisfies SummaryByTypeRow;
  });
}
