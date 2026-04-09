import { getAllNews } from "@/lib/rss";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verificar token de autorización
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const news = await getAllNews();

  if (news.length === 0) {
    return Response.json({ ok: false, error: "No news fetched" });
  }

  // Mapeamos NewsItem → fila de la tabla noticias
  const rows = news.map((item) => ({
    titulo:           item.title,
    url:              item.url,
    fuente:           item.source,
    fecha_publicacion: item.publishedAt.toISOString(),
    resumen:          item.summary,
    categoria:        item.category,
  }));

  const { error, count } = await supabaseAdmin
    .from("noticias")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Supabase upsert error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, fetched: news.length, inserted: count ?? 0 });
}
