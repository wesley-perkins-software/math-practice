export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  const g = (window as any).gtag;
  if (typeof g !== 'function') return;
  g('event', name, params);
}
