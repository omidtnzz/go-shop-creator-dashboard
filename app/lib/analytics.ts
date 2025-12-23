type Post = {
    id: string;
    platform: "instagram" | "tiktok";
    type: "reel" | "story" | "post" | "video";
    published_at: string; // ISO timestamp
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  
  type DailySale = {
    date: string; // YYYY-MM-DD
    revenue: number;
    orders: number;
  };
  
  export type DayRow = {
    date: string;
    revenue: number;
  
    // content posted on that date
    postsCount: number;
    viewsTotal: number;
    igCount: number;
    ttCount: number;
  
    reelCount: number;
    storyCount: number;
    postCount: number;
    videoCount: number;
  
    // revenue after posting (lag)
    revenuePlus1: number | null;
    revenuePlus2: number | null;
    revenueLagAvg: number | null; // avg of +1 and +2 (if available)
  };
  
  function toDateKeyUTC(iso: string) {
    // published_at is Z (UTC) in your data. We keep it simple: UTC date.
    return iso.slice(0, 10); // YYYY-MM-DD
  }
  
  function addDays(dateKey: string, days: number) {
    const d = new Date(dateKey + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  
  export function buildDayRows(posts: Post[], sales: DailySale[]): DayRow[] {
    const revenueByDate = new Map<string, number>();
    const allDates = new Set<string>();
  
    for (const s of sales) {
      revenueByDate.set(s.date, s.revenue);
      allDates.add(s.date);
    }
  
    // Aggregate posts by date
    const postsByDate = new Map<string, Post[]>();
    for (const p of posts) {
      const dateKey = toDateKeyUTC(p.published_at);
      allDates.add(dateKey);
      const arr = postsByDate.get(dateKey) ?? [];
      arr.push(p);
      postsByDate.set(dateKey, arr);
    }
  
    // Build sorted day rows
    const sortedDates = Array.from(allDates).sort();
    const rows: DayRow[] = sortedDates.map((date) => {
      const dayPosts = postsByDate.get(date) ?? [];
      const revenue = revenueByDate.get(date) ?? 0;
  
      const igPosts = dayPosts.filter((p) => p.platform === "instagram");
      const ttPosts = dayPosts.filter((p) => p.platform === "tiktok");
  
      const reelCount = dayPosts.filter((p) => p.type === "reel").length;
      const storyCount = dayPosts.filter((p) => p.type === "story").length;
      const postCount = dayPosts.filter((p) => p.type === "post").length;
      const videoCount = dayPosts.filter((p) => p.type === "video").length;
  
      const viewsTotal = dayPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);
  
      const d1 = addDays(date, 1);
      const d2 = addDays(date, 2);
  
      const r1 = revenueByDate.has(d1) ? revenueByDate.get(d1)! : null;
      const r2 = revenueByDate.has(d2) ? revenueByDate.get(d2)! : null;
  
      const lagAvg =
        r1 !== null && r2 !== null ? (r1 + r2) / 2 : r1 !== null ? r1 : r2 !== null ? r2 : null;
  
      return {
        date,
        revenue,
        postsCount: dayPosts.length,
        viewsTotal,
        igCount: igPosts.length,
        ttCount: ttPosts.length,
        reelCount,
        storyCount,
        postCount,
        videoCount,
        revenuePlus1: r1,
        revenuePlus2: r2,
        revenueLagAvg: lagAvg,
      };
    });
  
    // Keep only the date range that has sales (so the charts look clean)
    // Your sales file is 2025-12-01 to 2025-12-16, so we filter to those.
    const salesDates = sales.map((s) => s.date);
    const min = salesDates[0];
    const max = salesDates[salesDates.length - 1];
  
    return rows.filter((r) => r.date >= min && r.date <= max);
  }
  
  function mean(nums: number[]) {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  
  export type BucketInsight = {
    label: string;
    days: number;
    avgLagRevenue: number;
    baselineLagRevenue: number;
    liftPct: number; // vs baseline
  };
  
  export function bucketInsights(rows: DayRow[], bucket: (r: DayRow) => boolean, label: string): BucketInsight {
    const baseline = rows.map((r) => r.revenueLagAvg).filter((v): v is number => v !== null);
    const baselineMean = mean(baseline);
  
    const inBucket = rows
      .filter(bucket)
      .map((r) => r.revenueLagAvg)
      .filter((v): v is number => v !== null);
  
    const bucketMean = mean(inBucket);
  
    const lift = baselineMean === 0 ? 0 : ((bucketMean - baselineMean) / baselineMean) * 100;
  
    return {
      label,
      days: inBucket.length,
      avgLagRevenue: bucketMean,
      baselineLagRevenue: baselineMean,
      liftPct: lift,
    };
  }
  