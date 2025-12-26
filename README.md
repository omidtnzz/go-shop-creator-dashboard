# Go.Shop — Content Performance Insights (Product Builder Test)

## Objective
Help creators understand which content to post more of to drive revenue, not just reach.

## What this is
A prototype creator analytics dashboard that connects content patterns to downstream revenue using directional, lag-aware analysis (24–48h).

## Live demo
- Deployed dashboard: [(https://go-shop-creator-dashboard.vercel.app/)]
- Loom walkthrough (6–8 mins): [(https://www.loom.com/share/b07f9350db9e42d58dacccd39acff4fd)]

## Key insight
Instagram static posts show the strongest average future revenue lift (~15%) in this dataset, despite lower reach. Tiktok is better for brand awareness.

## Scope & decisions
- No per-post attribution (not possible with given data)
- No same-day revenue analysis (respects conversion lag)
- Focus on directional signals over precision

## Tech
- TypeScript + React
- Deployed on Vercel
- AI-assisted scaffolding and iteration

## If I had more time
- Collapse into 3–4 creator-facing views
- Weekly content mix recommendation
- Time-of-day and normalization (revenue per 1k views)

## Data
Provided by Go.Shop for this exercise (content_posts.json, daily_sales.json).


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


