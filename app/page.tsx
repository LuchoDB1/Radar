import { getAllNews } from "@/lib/rss";
import NewsFeed from "@/components/NewsFeed";

export default async function Home() {
  const news = await getAllNews();

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.06) 0%, transparent 60%), #060910" }}>

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/60 backdrop-blur-md bg-[#060910]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="live-dot w-2 h-2 rounded-full bg-sky-400 inline-block" />
              <h1 className="text-base font-bold text-white tracking-tight">◈ Radar AI</h1>
            </div>
            <span className="text-slate-600 text-sm hidden sm:block">|</span>
            <span className="text-slate-500 text-xs hidden sm:block">AI News Feed</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600">{news.length} noticias</span>
            <span className="text-xs text-slate-700 border border-slate-800 px-2 py-1 rounded">
              Caché · 1h
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <NewsFeed news={news} />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 py-6 text-center text-slate-700 text-xs mt-auto">
        Radar — Fuentes: The Verge · Ars Technica · VentureBeat · DeepMind · OpenAI · Hugging Face
      </footer>
    </div>
  );
}
