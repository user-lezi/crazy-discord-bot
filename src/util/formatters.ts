export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];

  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}

export function formatTime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  seconds %= 86400;

  const h = Math.floor(seconds / 3600);
  seconds %= 3600;

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`]
    .filter(Boolean)
    .join(" ");
}
