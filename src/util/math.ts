export function isPerfectSquare(n: number): boolean {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return false;
  }
  const root = Math.sqrt(n);
  return Number.isInteger(root);
}
