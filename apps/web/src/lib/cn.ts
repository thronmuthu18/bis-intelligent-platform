// ─────────────────────────────────────────────────────────────────────────────
//  cn — className utility
//  Merges class strings, filtering falsy values.
// ─────────────────────────────────────────────────────────────────────────────

export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}
