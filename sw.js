const CACHE_NAMESPACE = 'main-'

const CACHE = CACHE_NAMESPACE + 'precache-then-runtime';
const PRECACHE_LIST = [
  "./notes/",
  "./notes/offline.html",
  "./notes/js/jquery.min.js",
  "./notes/js/bootstrap.min.js",
  "./notes/js/notes.min.js",
  "./notes/js/snackbar.js",
  "./notes/img/avatar.jpg",
  "./notes/img/home-bg.jpg",
  "./notes/img/404-bg.jpg",
  "./notes/css/notes.min.css",
  "./notes/css/bootstrap.min.css"
  // "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.min.css",
  // "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/fonts/fontawesome-webfont.woff2?v=4.6.3",
  // "//cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js"
]
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  "eugeniosaintemarie.github.io/notes",
  "cdnjs.cloudflare.com"
]
const DEPRECATED_CACHES = ['precache-v1', 'runtime', 'main-precache-v1', 'main-runtime']

const staticNOTES = "notes"
const assets = [
  "/notes/index.html",
  "/notes/style.css",
  "/notes/app.js",
  "/notes/logo.png",
]

const getCacheBustingUrl = (req) => {
  var now = Date.now();
  url = new URL(req.url)

  url.protocol = self.location.protocol

  url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
  return url.href
}

const isNavigationReq = (req) => (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept').includes('text/html')))

const endWithExtension = (req) => Boolean(new URL(req.url).pathname.match(/\.\w+$/u))

const shouldRedirect = (req) => (isNavigationReq(req) && new URL(req.url).pathname.substr(-1) !== "/" && !endWithExtension(req))

const getRedirectUrl = (req) => {
  url = new URL(req.url)
  url.pathname += "/notes/"
  return url.href
}

self.addEventListener('activate', event => {
  caches.keys().then(cacheNames => Promise.all(
    cacheNames
      .filter(cacheName => DEPRECATED_CACHES.includes(cacheName))
      .map(cacheName => caches.delete(cacheName))
  ))
  console.log('service worker activated.')
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticNOTES).then(cache => {
      cache.addAll(assets)
    })
  )
})

var fetchHelper = {

  fetchThenCache: function (request) {
    const init = { mode: "cors", credentials: "omit" }

    const fetched = fetch(request, init)
    const fetchedCopy = fetched.then(resp => resp.clone());

    Promise.all([fetchedCopy, caches.open(CACHE)])
      .then(([response, cache]) => response.ok && cache.put(request, response))
      .catch(_ => { })

    return fetched;
  },

  cacheFirst: function (url) {
    return caches.match(url)
      .then(resp => resp || this.fetchThenCache(url))
      .catch(_ => { })
  }
}

self.addEventListener('fetch', event => {
  //console.log(`fetch ${event.request.url}`)
  //console.log(` - type: ${event.request.type}; destination: ${event.request.destination}`)
  //console.log(` - mode: ${event.request.mode}, accept: ${event.request.headers.get('accept')}`)

  if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {

    if (shouldRedirect(event.request)) {
      event.respondWith(Response.redirect(getRedirectUrl(event.request)))
      return;
    }

    if (event.request.url.indexOf('ys.static') > -1) {
      event.respondWith(fetchHelper.cacheFirst(event.request.url))
      return;
    }

    const cached = caches.match(event.request);
    const fetched = fetch(getCacheBustingUrl(event.request), { cache: "no-store" });
    const fetchedCopy = fetched.then(resp => resp.clone());

    event.respondWith(
      Promise.race([fetched.catch(_ => cached), cached])
        .then(resp => resp || fetched)
        .catch(_ => caches.match('offline.html'))
    );

    event.waitUntil(
      Promise.all([fetchedCopy, caches.open(CACHE)])
        .then(([response, cache]) => response.ok && cache.put(event.request, response))
        .catch(_ => { })
    );

    if (isNavigationReq(event.request)) {
      console.log(`fetch ${event.request.url}`)
      event.waitUntil(revalidateContent(cached, fetchedCopy))
    }
  }
});

function revalidateContent(cachedResp, fetchedResp) {
  return Promise.all([cachedResp, fetchedResp])
    .then(([cached, fetched]) => {
      const cachedVer = cached.headers.get('last-modified')
      const fetchedVer = fetched.headers.get('last-modified')
      console.log(`"${cachedVer}" vs. "${fetchedVer}"`);
      if (cachedVer !== fetchedVer) {
        sendMessageToClientsAsync({
          'command': 'UPDATE_FOUND',
          'url': fetched.url
        })
      }
    })
    .catch(err => console.log(err))
}

function sendMessageToAllClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      console.log(client);
      client.postMessage(msg)
    })
  })
}

function sendMessageToClientsAsync(msg) {
  setTimeout(() => {
    sendMessageToAllClients(msg)
  }, 1000)
}