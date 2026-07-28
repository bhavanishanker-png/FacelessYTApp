import { connectDB } from "@/lib/db";
import HookFormula from "@/models/HookFormula";
import type { IHookFormula } from "@/models/HookFormula";

// ─── TF-IDF Cosine Similarity ─────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function buildVocab(docs: string[][]): string[] {
  const vocab = new Set<string>();
  docs.forEach((tokens) => tokens.forEach((t) => vocab.add(t)));
  return Array.from(vocab);
}

function computeIdf(vocab: string[], docs: string[][]): Map<string, number> {
  const N = docs.length;
  const idf = new Map<string, number>();
  vocab.forEach((term) => {
    const df = docs.filter((tokens) => tokens.includes(term)).length;
    idf.set(term, Math.log((N + 1) / (df + 1)) + 1);
  });
  return idf;
}

function tfidfVector(
  tokens: string[],
  vocab: string[],
  idf: Map<string, number>
): number[] {
  const tf = new Map<string, number>();
  tokens.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
  return vocab.map(
    (v) => ((tf.get(v) ?? 0) / (tokens.length || 1)) * (idf.get(v) ?? 0)
  );
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Retrieve the top-k active hook formulas most similar to `query`.
 * Fetches live from MongoDB so the corpus can be managed without redeploys.
 */
export async function retrieveHookFormulas(
  query: string,
  topK = 3
): Promise<IHookFormula[]> {
  await connectDB();

  const formulas = await HookFormula.find({ active: true }).lean<IHookFormula[]>();

  if (formulas.length === 0) return [];

  const docTexts = formulas.map((f) =>
    [f.formula, f.style, f.psychTrigger, ...f.niches, ...f.tone, f.exampleHook].join(" ")
  );

  const docTokens = docTexts.map(tokenize);
  const queryTokens = tokenize(query);

  const vocab = buildVocab([...docTokens, queryTokens]);
  const idf = computeIdf(vocab, [...docTokens, queryTokens]);

  const queryVec = tfidfVector(queryTokens, vocab, idf);

  return formulas
    .map((formula, i) => ({
      formula,
      score: cosineSimilarity(tfidfVector(docTokens[i], vocab, idf), queryVec),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.formula);
}

/**
 * Format retrieved formulas as a context block for the LLM user message.
 */
export function formatFormulasAsContext(formulas: IHookFormula[]): string {
  return formulas
    .map(
      (f, i) =>
        `Formula ${i + 1} [${f.style}, triggers: ${f.psychTrigger}]:\n` +
        `  Template: ${f.formula}\n` +
        `  Example:  ${f.exampleHook}\n` +
        `  Est. retention boost: ${f.estimatedRetention}%`
    )
    .join("\n\n");
}
