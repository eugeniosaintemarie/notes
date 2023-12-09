const staticNOTES = "notes"
const assets = [
  "/notes/index.html",
  "/notes/js/sw-registration.js",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticNOTES).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})