import content from "../data/content_posts.json";
import sales from "../data/daily_sales.json";

export default function Home() {
  const postsCount = content.posts.length;
  const daysCount = sales.daily_sales.length;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Creator Analytics Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Quick sanity check: the app is reading your JSON files.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Posts loaded</div>
          <div className="text-2xl font-semibold">{postsCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Sales days loaded</div>
          <div className="text-2xl font-semibold">{daysCount}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <div className="text-sm text-gray-500">Sample post title</div>
        <div className="text-lg font-medium">{content.posts[0].title}</div>
        <div className="mt-2 text-sm text-gray-500">Sample sales day revenue</div>
        <div className="text-lg font-medium">£{sales.daily_sales[0].revenue}</div>
      </div>
    </main>
  );
}

