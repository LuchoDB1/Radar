import { NewsItem } from "@/types";

const categoryStyles: Record<string, { pill: string; dot: string }> = {
  Modelos:    { pill: "bg-purple-500/10 text-purple-400 border-purple-500/20",  dot: "bg-purple-400" },
  Empresas:   { pill: "bg-sky-500/10 text-sky-400 border-sky-500/20",           dot: "bg-sky-400" },
  Research:   { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  Tools:      { pill: "bg-orange-500/10 text-orange-400 border-orange-500/20",  dot: "bg-orange-400" },
  Regulación: { pill: "bg-red-500/10 text-red-400 border-red-500/20",           dot: "bg-red-400" },
  General:    { pill: "bg-slate-500/10 text-slate-400 border-slate-500/20",     dot: "bg-slate-400" },
};

const sourceStyles: Record<string, string> = {
  "The Verge":    "text-emerald-400",
  "Ars Technica": "text-orange-400",
  "VentureBeat":  "text-sky-400",
  "DeepMind":     "text-cyan-400",
  "OpenAI":       "text-green-400",
  "Hugging Face": "text-yellow-400",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function NewsCard({ item }: { item: NewsItem }) {
  const cat = categoryStyles[item.category] ?? categoryStyles.General;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all duration-200 hover:bg-slate-900/50"
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${sourceStyles[item.source] ?? "text-slate-400"}`}>
          {item.source}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.pill}`}>
          {item.category}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-sm font-semibold text-slate-100 leading-snug group-hover:text-white transition-colors line-clamp-3">
        {item.title}
      </h2>

      {/* Summary */}
      {item.summary && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          <span className="text-xs text-slate-600">{item.category}</span>
        </div>
        <span className="text-xs text-slate-600">{timeAgo(item.publishedAt)}</span>
      </div>
    </a>
  );
}
