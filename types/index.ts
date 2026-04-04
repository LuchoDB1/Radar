export type Category =
  | "Modelos"
  | "Empresas"
  | "Research"
  | "Tools"
  | "Regulación"
  | "General";

export type Source =
  | "The Verge"
  | "Ars Technica"
  | "VentureBeat"
  | "DeepMind"
  | "OpenAI"
  | "Hugging Face"
  | "MIT Tech Review";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: Source;
  publishedAt: Date;
  summary: string;
  category: Category;
}

export interface RSSFeed {
  source: Source;
  url: string;
}
