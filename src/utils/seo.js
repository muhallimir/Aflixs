// Manual SEO helper (no new deps): updates document title + meta description
// + Open Graph tags per screen. Safe to call from any screen effect.

export function setPageMeta({ title, description, path } = {}) {
  const site = "Aflixs";
  const fullTitle = title ? `${title} | ${site}` : site;
  try {
    document.title = fullTitle;
  } catch (e) {
    // ignore
  }
  const desc =
    description || "Aflixs: browse trending movies and TV shows, My List, and more.";
  upsertMeta("name", "description", desc);
  upsertMeta("property", "og:title", fullTitle);
  upsertMeta("property", "og:description", desc);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", site);
  if (path) {
    try {
      upsertMeta("property", "og:url", `${window.location.origin}${path}`);
    } catch (e) {
      // ignore
    }
  }
}

function upsertMeta(attr, key, content) {
  try {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  } catch (e) {
    // ignore (non-browser)
  }
}
