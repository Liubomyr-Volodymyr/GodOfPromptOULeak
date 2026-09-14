/**
 * Page-view reporting for surfaces that aren't a full navigation.
 *
 * WHY THIS SHAPE: the GOP GTM container forwards ONLY `page_view` to GA4 —
 * there are no custom-event tags in it. A `sheet_opened` custom event would
 * be dropped on the floor. So anything we want to measure (a sheet, a modal,
 * a step) has to present itself as a page view with its own path.
 *
 * ⚠️ NOTHING IS INSTALLED YET. gop-web ships no GTM/GA4/dataLayer snippet at
 * all, so these calls are currently no-ops that queue into `window.dataLayer`
 * and go nowhere. That is deliberate: the instrumentation is correct and in
 * place, and the moment the container script is added to the root layout
 * every sheet open starts counting with no further code changes.
 *
 * Pair with `useSheetRoute`, which also pushes the path into history so the
 * URL is shareable and the back button closes the sheet.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Report a virtual page view.
 *
 * @param path  Root-relative path this surface represents, e.g.
 *              "/prompt-generator". Must be a real, linkable URL — a made-up
 *              path pollutes GA4's page reports with routes that 404.
 * @param title Document title to report alongside it.
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: "page_view",
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: title ?? document.title,
  });
}
