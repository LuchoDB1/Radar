import { getAllNews } from "@/lib/rss";
import { Category } from "@/types";

export const revalidate = 0; // sin caché — siempre fresco

export async function GET() {
  const news = await getAllNews();
  const generatedAt = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

  // Conteo por categoría
  const counts: Record<string, number> = {};
  for (const item of news) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }

  // Top 5 más recientes por categoría
  const categories: Category[] = ["Modelos", "Empresas", "Research", "Tools", "Regulación", "General"];

  const categoryColors: Record<string, string> = {
    Modelos:    "#a855f7",
    Empresas:   "#38bdf8",
    Research:   "#34d399",
    Tools:      "#fb923c",
    Regulación: "#f87171",
    General:    "#94a3b8",
  };

  const sections = categories
    .filter((cat) => counts[cat])
    .map((cat) => {
      const items = news.filter((n) => n.category === cat).slice(0, 5);
      const color = categoryColors[cat];
      const rows = items.map((item) => `
        <tr>
          <td><a href="${item.url}" target="_blank">${item.title}</a></td>
          <td>${item.source}</td>
          <td>${item.publishedAt.toLocaleDateString("es-AR")}</td>
        </tr>`).join("");

      return `
        <section>
          <h2 style="color:${color};border-bottom:1px solid ${color}33;padding-bottom:6px">
            ${cat} <span style="font-size:12px;opacity:0.6">(${counts[cat]})</span>
          </h2>
          <table>
            <thead><tr><th>Título</th><th>Fuente</th><th>Fecha</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Radar — Reporte ${generatedAt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060910; color: #cbd5e1; font-family: 'JetBrains Mono', monospace, sans-serif; padding: 32px; }
    h1 { color: #f8fafc; font-size: 20px; margin-bottom: 4px; }
    .meta { color: #475569; font-size: 12px; margin-bottom: 32px; }
    section { margin-bottom: 40px; }
    h2 { font-size: 14px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #475569; padding: 6px 8px; border-bottom: 1px solid #1e293b; }
    td { padding: 8px; border-bottom: 1px solid #0f172a; vertical-align: top; }
    td:first-child { width: 65%; }
    td:last-child { color: #475569; white-space: nowrap; }
    a { color: #e2e8f0; text-decoration: none; }
    a:hover { color: #38bdf8; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
    .pill { background: #0f172a; border: 1px solid #1e293b; padding: 8px 16px; border-radius: 6px; font-size: 12px; }
    .pill span { display: block; font-size: 20px; font-weight: bold; color: #f8fafc; }
  </style>
</head>
<body>
  <h1>◈ Radar — Reporte diario</h1>
  <p class="meta">Generado el ${generatedAt} · ${news.length} noticias totales</p>
  <div class="summary">
    ${categories.filter(c => counts[c]).map(cat =>
      `<div class="pill" style="border-color:${categoryColors[cat]}33">
        <span style="color:${categoryColors[cat]}">${counts[cat]}</span>${cat}
      </div>`
    ).join("")}
  </div>
  ${sections}
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
