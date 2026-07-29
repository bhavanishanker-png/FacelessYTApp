import ViralContent, { IViralContent } from "@/models/ViralContent";
import { connectDB } from "@/lib/db";

// ─── TF-IDF Helpers ───────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function buildVocab(docs: string[][]): string[] {
  const seen = new Set<string>();
  for (const tokens of docs) {
    for (const t of tokens) seen.add(t);
  }
  return Array.from(seen);
}

function computeIdf(vocab: string[], docs: string[][]): number[] {
  const N = docs.length;
  return vocab.map((term) => {
    const df = docs.filter((d) => d.includes(term)).length;
    return df > 0 ? Math.log((N + 1) / (df + 1)) + 1 : 1;
  });
}

function tfidfVector(tokens: string[], vocab: string[], idf: number[]): number[] {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const total = tokens.length || 1;
  return vocab.map((term, i) => ((freq[term] || 0) / total) * idf[i]);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ─── Retriever ────────────────────────────────────────────────

export async function retrieveViralContent(
  query: string,
  topK = 5
): Promise<IViralContent[]> {
  await connectDB();
  const corpus = await ViralContent.find({ active: true }).lean();
  if (corpus.length === 0) return [];

  // Build a rich text representation for each entry
  const docTexts = corpus.map((c) =>
    [c.title, c.topic, ...(c.niche || []), c.hook, c.keyInsight, c.viralFactor, ...(c.tone || [])].join(" ")
  );

  const tokenizedDocs = docTexts.map(tokenize);
  const tokenizedQuery = tokenize(query);

  const vocab = buildVocab([tokenizedQuery, ...tokenizedDocs]);
  const idf = computeIdf(vocab, [tokenizedQuery, ...tokenizedDocs]);

  const queryVec = tfidfVector(tokenizedQuery, vocab, idf);
  const scores = tokenizedDocs.map((tokens) => {
    const vec = tfidfVector(tokens, vocab, idf);
    return cosineSimilarity(queryVec, vec);
  });

  return corpus
    .map((entry, i) => ({ entry, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ entry }) => entry as unknown as IViralContent);
}

// ─── Context Formatter ────────────────────────────────────────

export function formatViralContentAsContext(items: IViralContent[]): string {
  if (items.length === 0) return "";

  return items
    .map(
      (item, i) => `
Example ${i + 1}: "${item.title}"
  Niche: ${item.niche?.join(", ")}
  Hook Type: ${item.hookType}
  Opening Hook: "${item.hook}"
  Storytelling Pattern: ${item.storytellingPattern}
  Content Structure: ${item.contentStructure}
  Key Insight: ${item.keyInsight}
  Why It Went Viral: ${item.viralFactor}
  Estimated Views: ${item.estimatedViews}
  Tone: ${item.tone?.join(", ")}`
    )
    .join("\n");
}
