import { NewsItem, RSSFeed, Source } from "@/types";
import { inferCategory } from "./categories";

const FEEDS: RSSFeed[] = [
  { source: "The Verge",    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml" },
  { source: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/technology-lab" },
  { source: "VentureBeat",  url: "https://feeds.feedburner.com/venturebeat/SZYF" },
  { source: "DeepMind",     url: "https://deepmind.google/blog/rss.xml" },
  { source: "OpenAI",       url: "https://openai.com/news/rss.xml" },
  { source: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { source: "MIT Tech Review", url: "https://www.technologyreview.com/feed/" },
];

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i").exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i").exec(xml);
  return match ? match[1].trim() : "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

function parseDate(raw: string): Date {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

function splitItems(xml: string): string[] {
  // Soporta tanto <item> (RSS) como <entry> (Atom)
  const rssItems = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
  if (rssItems.length > 0) return rssItems;
  return [...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);
}

async function parseFeed(feed: RSSFeed): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = splitItems(xml).slice(0, 15);

    return items.map((item, i) => {
      const title   = stripHtml(extractTag(item, "title"));
      const url     = extractTag(item, "link") || extractAttr(item, "link", "href");
      const rawDesc = extractTag(item, "description") || extractTag(item, "summary") || extractTag(item, "content");
      const summary = stripHtml(rawDesc).slice(0, 220);
      const pubDate = extractTag(item, "pubDate") || extractTag(item, "published") || extractTag(item, "updated");

      return {
        id:          `${feed.source}-${i}-${pubDate}`,
        title,
        url,
        source:      feed.source as Source,
        publishedAt: parseDate(pubDate),
        summary,
        category:    inferCategory(title, summary, feed.source as Source),
      };
    });
  } catch {
    return [];
  }
}

export async function getAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS.map(parseFeed));

  const news = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.url);

  return news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
