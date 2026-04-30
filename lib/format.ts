export function formatBytes(bytes?: number | null) {
  if (!bytes || Number.isNaN(bytes)) return '-';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
