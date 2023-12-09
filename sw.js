const staticNOTES = "notes"
const assets = [
  "/notes/index.html",
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