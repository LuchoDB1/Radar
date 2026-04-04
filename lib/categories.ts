import { Category, Source } from "@/types";

const keywordMap: Record<Category, string[]> = {
  Modelos: [
    "gpt", "gemini", "claude", "llama", "mistral", "model", "modelo",
    "llm", "transformer", "diffusion", "stable diffusion", "dall-e",
    "sora", "multimodal", "fine-tun", "training", "weights",
  ],
  Empresas: [
    "openai", "google", "meta", "anthropic", "microsoft", "apple",
    "amazon", "nvidia", "deepmind", "inflection", "cohere", "hugging face",
    "startup", "funding", "valuation", "acquisition", "ceo",
  ],
  Research: [
    "paper", "research", "arxiv", "study", "benchmark", "dataset",
    "experiment", "findings", "scientists", "laboratory", "breakthrough",
    "algorithm", "architecture",
  ],
  Tools: [
    "tool", "app", "product", "launch", "release", "feature", "update",
    "plugin", "integration", "api", "sdk", "platform", "copilot",
    "assistant", "chatbot", "agent",
  ],
  Regulación: [
    "regulation", "law", "policy", "government", "congress", "senate",
    "eu", "ban", "safety", "risk", "ethics", "bias", "responsible",
    "compliance", "lawsuit", "copyright",
  ],
  General: [],
};

// Fuentes que siempre caen en una categoría por defecto
const sourceDefaults: Partial<Record<Source, Category>> = {
  DeepMind: "Research",
  OpenAI: "Empresas",
};

export function inferCategory(
  title: string,
  summary: string,
  source: Source
): Category {
  const text = `${title} ${summary}`.toLowerCase();

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (category === "General") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return category as Category;
    }
  }

  return sourceDefaults[source] ?? "General";
}
