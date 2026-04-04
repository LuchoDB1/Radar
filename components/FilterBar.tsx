"use client";

import { Category } from "@/types";
import { useState } from "react";

const CATEGORIES: (Category | "Todas")[] = [
  "Todas", "Modelos", "Empresas", "Research", "Tools", "Regulación", "General",
];

const styles: Record<string, { active: string; dot: string }> = {
  Todas:      { active: "bg-slate-100 text-slate-900 border-slate-100",          dot: "bg-slate-400" },
  Modelos:    { active: "bg-purple-500 text-white border-purple-500",             dot: "bg-purple-400" },
  Empresas:   { active: "bg-sky-500 text-white border-sky-500",                   dot: "bg-sky-400" },
  Research:   { active: "bg-emerald-500 text-white border-emerald-500",           dot: "bg-emerald-400" },
  Tools:      { active: "bg-orange-500 text-white border-orange-500",             dot: "bg-orange-400" },
  Regulación: { active: "bg-red-500 text-white border-red-500",                   dot: "bg-red-400" },
  General:    { active: "bg-slate-500 text-white border-slate-500",               dot: "bg-slate-400" },
};

interface Props {
  onFilter: (category: Category | "Todas") => void;
  counts: Record<string, number>;
}

export default function FilterBar({ onFilter, counts }: Props) {
  const [active, setActive] = useState<Category | "Todas">("Todas");

  function handleClick(cat: Category | "Todas") {
    setActive(cat);
    onFilter(cat);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat;
        const s = styles[cat];
        return (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              isActive
                ? s.active
                : "bg-transparent text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-300"
            }`}
          >
            {!isActive && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} opacity-60`} />}
            {cat}
            {counts[cat] !== undefined && (
              <span className={`text-xs ${isActive ? "opacity-70" : "text-slate-600"}`}>
                {counts[cat]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
