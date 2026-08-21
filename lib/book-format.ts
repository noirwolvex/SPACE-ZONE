/**
 * Presentation helpers shared by every book surface (cards, details page,
 * purchase panel) so a price never renders differently in two places.
 */

/** Free books store `price = NULL`; anything else renders with its currency. */
export function formatBookPrice(price: number | null | undefined, currency: string) {
  if (price == null) return "Free";
  return `${price.toFixed(price % 1 === 0 ? 0 : 3)} ${currency}`;
}

/** Human-readable file size for the details page. */
export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return null;

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
