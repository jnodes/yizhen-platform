// Service Worker for Yizhen Platform
// Provides caching, offline functionality, and performance optimization

const CACHE_NAME = 'yizhen-v1.2.0';
const STATIC_CACHE = 'yizhen-static-v1.2.0';
const DYNAMIC_CACHE = 'yizhen-dynamic-v1.2.0';
const VIDEO_CACHE = 'yizhen-videos-v1.2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/web3.js',
  '/assets/js/lazy-loader.js',
  '/assets/js/ui-manager.js',
  '/assets/data/artifacts.json',
  '/assets/images/hero-bg.jpg',
  '/assets/images/placeholder.jpg',
  '/favicon.svg',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap'
];

// Critical video assets to cache
const CRITICAL_VIDEOS = [
  '/assets/videos/relics/001-jun-washer/main.mp4',
  '/assets/videos/relics/002-jun-plate/main.mp4',
  '/assets/videos/relics/003-celadon-bowl/main.mp4'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Route handlers
const ROUTE_HANDLERS = [
  {
    pattern: /\.(js|css|woff2?|eot|ttf|otf)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST
  },
  {
    pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST
  },
  {
    pattern: /\.mp4$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: VIDEO_CACHE
  },
  {
    pattern: /\/assets\/data\//,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE
  },
  {
    pattern: /^https:\/\/cdn\.jsdelivr\.net/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE
  },
  {
    pattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST
  }
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    Promise.all([
      cacheStaticAssets(),
      cacheCriticalVideos()
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    cleanupOldCaches().then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(handleRequest(event.request));
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(showNotification(data));
  }
});

// Cache static assets
async function cacheStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);
  
  // Cache assets in batches to avoid overwhelming the browser
  const batchSize = 5;
  for (let i = 0; i < STATIC_ASSETS.length; i += batchSize) {
    const batch = STATIC_ASSETS.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(url => cache.add(url).catch(err => {
        console.warn(`Failed to cache ${url}:`, err);
      }))
    );
  }
}

// Cache critical videos
async function cacheCriticalVideos() {
  const cache = await caches.open(VIDEO_CACHE);
  
  for (const videoUrl of CRITICAL_VIDEOS) {
    try {
      await cache.add(videoUrl);
    } catch (error) {
      console.warn(`Failed to cache video ${videoUrl}:`, error);
    }
  }
}

// Clean up old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, VIDEO_CACHE];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!currentCaches.includes(cacheName)) {
        console.log('Service Worker: Deleting old cache', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// Handle requests based on strategy
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Find matching route handler
  const handler = ROUTE_HANDLERS.find(route => route.pattern.test(url.pathname + url.search));
  
  if (handler) {
    return executeStrategy(request, handler.strategy, handler.cache);
  }
  
  // Default strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    return executeStrategy(request, CACHE_STRATEGIES.NETWORK_FIRST);
  }
  
  // Default strategy for everything else
  return executeStrategy(request, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE);
}

// Execute caching strategy
async function executeStrategy(request, strategy, cacheName = DYNAMIC_CACHE) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cacheName);
    
    default:
      return fetch(request);
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Otherwise wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Cache Only Strategy
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  return createOfflineResponse(request);
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Offline page for HTML requests
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(getOfflineHTML(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Offline image for image requests
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return new Response(getOfflineImage(), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  // Generic offline response
  return new Response('Offline - Please check your connection', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Offline HTML template
function getOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Yizhen 艺珍</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                background: #f8f8f8;
                color: #333;
            }
            .offline-container {
                text-align: center;
                max-width: 400px;
                padding: 2rem;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            .offline-title {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: #c9302c;
            }
            .offline-message {
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .retry-button {
                background: #c9302c;
                color: white;
                border: none;
                padding: 0.75rem 2rem;
                font-size: 1rem;
                cursor: pointer;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }
            .retry-button:hover {
                background: #a02622;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📡</div>
            <h1 class="offline-title">You're Offline</h1>
            <p class="offline-message">
                It looks like you've lost your internet connection. 
                Some content may not be available while offline.
            </p>
            <button class="retry-button" onclick="window.location.reload()">
                Try Again
            </button>
        </div>
    </body>
    </html>
  `;
}

// Offline image placeholder
function getOfflineImage() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
      <rect width="200" height="150" fill="#f8f8f8"/>
      <text x="100" y="75" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="#666">Image Unavailable</text>
    </svg>
  `;
}

// Handle background sync
async function handleBackgroundSync() {
  console.log('Service Worker: Handling background sync');
  
  // Process any pending offline actions
  const pendingActions = await getStoredActions();
  
  for (const action of pendingActions) {
    try {
      await processAction(action);
      await removeStoredAction(action.id);
    } catch (error) {
      console.error('Failed to process action:', error);
    }
  }
}

// Get stored offline actions
async function getStoredActions() {
  try {
    const cache = await caches.open('offline-actions');
    const response = await cache.match('/offline-actions');
    
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to get stored actions:', error);
  }
  
  return [];
}

// Remove processed action
async function removeStoredAction(actionId) {
  try {
    const actions = await getStoredActions();
    const updatedActions = actions.filter(action => action.id !== actionId);
    
    const cache = await caches.open('offline-actions');
    await cache.put('/offline-actions', new Response(JSON.stringify(updatedActions)));
  } catch (error) {
    console.error('Failed to remove stored action:', error);
  }
}

// Process individual action
async function processAction(action) {
  switch (action.type) {
    case 'bid':
      return processBidAction(action);
    default:
      console.warn('Unknown action type:', action.type);
  }
}

// Process bid action
async function processBidAction(action) {
  const response = await fetch('/api/bids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(action.data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to process bid: ${response.status}`);
  }
  
  // Notify client of successful sync
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      action: action
    });
  });
}

// Show push notification
async function showNotification(data) {
  const options = {
    body: data.body || 'New auction update available',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    image: data.image,
    data: data,
    actions: [
      {
        action: 'view',
        title: 'View Auction'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  
  return self.registration.showNotification(data.title || 'Yizhen Auction', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data.urls));
      break;
    
    case 'CLEAR_CACHE':
      event.waitUntil(clearSpecificCache(data.cacheName));
      break;
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch (error) {
      console.warn(`Failed to cache ${url}:`, error);
    }
  }
}

// Clear specific cache
async function clearSpecificCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log(`Cache ${cacheName} cleared`);
  } catch (error) {
    console.error(`Failed to clear cache ${cacheName}:`, error);
  }
}

// Periodic cleanup
setInterval(() => {
  cleanupOldCaches();
}, 24 * 60 * 60 * 1000); // Run daily
