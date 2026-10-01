import { CacheManager } from "../../managers/CacheManager";
import { OllamaService } from "./ollama";
import { cosineSimilarity } from "../../util/math";

export interface EmbeddingsCacheEntry {
  embedding: number[];
  createdAt: number;
}

export class Embeddings {
  public values = new CacheManager<EmbeddingsCacheEntry>();

  constructor(private ollama: typeof OllamaService) {}

  private validateEmbedding(embedding: unknown): number[] {
    if (
      !Array.isArray(embedding) ||
      embedding.some((value) => typeof value !== "number")
    ) {
      throw new Error("Ollama returned an invalid embedding");
    }

    return embedding;
  }

  public async create(text: string): Promise<number[]> {
    const input = text.trim();
    if (!input) return [];

    const cached = this.values.get(input);
    if (cached) return cached.embedding;

    const result = await this.ollama.embed({
      input,
      model: "embeddinggemma",
    });

    const embedding = this.validateEmbedding(result.embeddings[0]);
    this.values.set(input, { embedding, createdAt: Date.now() });

    return embedding;
  }

  public async createMany(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = new Array(texts.length).fill([]);
    const pending: Array<{ index: number; text: string }> = [];

    for (let index = 0; index < texts.length; index++) {
      const text = texts[index]?.trim() ?? "";
      if (!text) continue;

      const cached = this.values.get(text);
      if (cached) {
        embeddings[index] = cached.embedding;
        continue;
      }

      pending.push({ index, text });
    }

    if (pending.length === 0) {
      return embeddings;
    }

    const result = await this.ollama.embed({
      input: pending.map((entry) => entry.text),
      model: "embeddinggemma",
    });

    if (
      !Array.isArray(result.embeddings) ||
      result.embeddings.length !== pending.length
    ) {
      throw new Error("Ollama returned an invalid embedding batch");
    }

    for (let i = 0; i < pending.length; i++) {
      const { index, text } = pending[i];
      const embedding = this.validateEmbedding(result.embeddings[i]);

      embeddings[index] = embedding;
      this.values.set(text, { embedding, createdAt: Date.now() });
    }

    return embeddings;
  }

  public async similarity(a: string, b: string): Promise<number> {
    let embeddings = await this.createMany([a, b]);
    return cosineSimilarity(embeddings[0], embeddings[1]);
  }

  public async closest(
    text: string,
    candidates: string[],
    top: number,
  ): Promise<
    | { candidate: string; similarity: number; relativeSimilarity: number }[]
    | null
  > {
    let embeddings = await this.createMany([text, ...candidates]);
    let best: { candidate: string; similarity: number }[] = [];

    for (let i = 1; i < embeddings.length; i++) {
      let similarity = cosineSimilarity(embeddings[0], embeddings[i]);
      best.push({ candidate: candidates[i - 1], similarity });
    }

    return best
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, top)
      .map((entry) => ({
        ...entry,
        relativeSimilarity: entry.similarity / best[0].similarity,
      }));
  }

  public distance(a: string, b: string): Promise<number> {
    return this.similarity(a, b).then((similarity) => 1 - similarity);
  }

  public async combinationSimilarities(
    candidates: string[],
  ): Promise<{ combination: string[]; similarity: number }[]> {
    const embeddings = await this.createMany(candidates);
    const results: { combination: string[]; similarity: number }[] = [];
    if (candidates.length < 2) return results;

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        results.push({
          combination: [candidates[i], candidates[j]],
          similarity,
        });
      }
    }
    return results;
  }

  public async sortedCombinationSimilarities(
    candidates: string[],
    top: number,
  ): Promise<
    { combination: string[]; similarity: number; relativeSimilarity: number }[]
  > {
    const results = await this.combinationSimilarities(candidates);
    const sorted = results.sort((a, b) => b.similarity - a.similarity);
    const topResults = sorted.slice(0, top);
    const maxSimilarity = topResults[0]?.similarity ?? 1;
    return topResults.map((entry) => ({
      ...entry,
      relativeSimilarity: entry.similarity / maxSimilarity,
    }));
  }

  public clear(): void {
    this.values.clear();
  }
}
