export function colorDistanceSq(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const rMean = (a[0] + b[0]) / 2;

  return (
    ((512 + rMean) * dr * dr) / 256 +
    4 * dg * dg +
    ((767 - rMean) * db * db) / 256
  );
}
