export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  try {
    if (typeof window === 'undefined') return;
    const g = (window as any).gtag;
    if (typeof g !== 'function') return;
    g('event', name, params);
  } catch {
    // Analytics is best-effort: blockers or a broken vendor script must not affect practice.
  }
}
