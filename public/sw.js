// Minimal Aflixs service worker: offline fallback only (no app-shell caching,
// so deploys are never stale). Caches offline.html at install; on a failed
// navigation request, serves the fallback page.
const CACHE = "aflixs-offline-v1";
const FALLBACK = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(FALLBACK))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(FALLBACK).then((res) => res || Response.error())
    )
  );
});
