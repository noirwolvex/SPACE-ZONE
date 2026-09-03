/**
 * Accept only same-origin relative redirects.
 *
 * Absolute URLs and protocol-relative URLs are rejected so query-string
 * redirect targets cannot be used for phishing/open-redirect attacks.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;
  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}
