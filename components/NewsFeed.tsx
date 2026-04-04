"use client";

import { useState, useMemo } from "react";
import { NewsItem, Category } from "@/types";
import NewsCard from "./NewsCard";
import FilterBar from "./FilterBar";

export default function NewsFeed({ news }: { news: NewsItem[] }) {
  const [activeCategory, setActiveCategory] = useState<Category | "Todas">("Todas");

  const counts = useMemo(() => {
    const c: Record<string, number> = { Todas: news.length };
    for (const item of news) {
      c[item.category] = (c[item.category] ?? 0) + 1;
    }
    return c;
  }, [news]);

  const filtered = useMemo(() =>
    activeCategory === "Todas"
      ? news
      : news.filter((item) => item.category === activeCategory),
    [news, activeCategory]
  );

  return (
    <div className="space-y-6">
      <FilterBar onFilter={setActiveCategory} counts={counts} />
      <p className="text-xs text-slate-500">{filtered.length} noticias</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
