import { NewsItem, Category, Source } from "@/types";
import { supabase } from "./supabase";

interface NoticiaRow {
  id: string;
  titulo: string;
  url: string;
  fuente: string;
  fecha_publicacion: string;
  resumen: string | null;
  categoria: string | null;
}

export async function getAllNewsFromDB(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("noticias")
    .select("id, titulo, url, fuente, fecha_publicacion, resumen, categoria")
    .order("fecha_publicacion", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Supabase error:", error.message);
    return [];
  }

  return (data as NoticiaRow[]).map((row) => ({
    id: row.id,
    title: row.titulo,
    url: row.url,
    source: row.fuente as Source,
    publishedAt: new Date(row.fecha_publicacion),
    summary: row.resumen ?? "",
    category: (row.categoria as Category) ?? "General",
  }));
}
