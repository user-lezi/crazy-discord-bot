export function clamp(value: number, min: number, max: number): number {
  if (min > max) [max, min] = [min, max];

  return Math.min(Math.max(value, min), max);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new RangeError("Vectors must have the same length");
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] ** 2;
    magnitudeB += b[i] ** 2;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / Math.sqrt(magnitudeA * magnitudeB);
}

export function reduceVector(vec: number[], to = 2, seed = 42) {
  const n = vec.length;

  // Simple deterministic pseudo-random generator (Mulberry32)
  const random = (s: number) => {
    return () => {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const rand = random(seed);
  const result = new Array(to).fill(0);

  // Matrix multiplication: result[j] = dot(vec, projection_row_j)
  const scale = 1 / Math.sqrt(n); // Normalizes scale across dimensions
  for (let j = 0; j < to; j++) {
    for (let i = 0; i < n; i++) {
      // Gaussian approximation using standard uniform samples
      const weight = (rand() - 0.5) * 2 * Math.sqrt(3) * scale;
      result[j] += vec[i] * weight;
    }
  }

  return result;
}
