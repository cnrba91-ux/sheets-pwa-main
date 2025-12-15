---
description: How to deploy and handle service worker updates
---

# Deployment Guide

## What Was Fixed

The blank page issue after deployment was caused by an **aggressive service worker cache** that served old cached content instead of fetching the new deployment. A hard refresh worked because it bypassed the cache.

## Solution Implemented

Updated the service worker (`public/sw.js`) with a smart caching strategy:

### Caching Strategies

1. **Network-first for HTML files**
   - Always fetches fresh HTML from the network
   - Falls back to cache only if offline
   - **This fixes the blank page issue!**

2. **Cache-first for static assets** (CSS, JS, images, fonts)
   - Serves from cache for fast loading
   - Fetches and caches new assets if not in cache
   - Maintains PWA performance benefits

3. **No caching for Google APIs**
   - All requests to `googleapis.com`, `google.com`, and `accounts.google.com` bypass cache
   - **Ensures your Google Sheets read/write operations always work correctly**

### Cache Management

- **Version-based caching**: Cache names include version number (`v2`)
- **Automatic cleanup**: Old caches are deleted on activation
- **Immediate activation**: `skipWaiting()` and `claim()` ensure updates apply immediately

## Deployment Steps

// turbo-all

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Update service worker for better cache management"
   git push origin main
   ```

3. **GitHub Pages will auto-deploy** (if enabled)
   - Your site should update within 1-2 minutes
   - No hard refresh needed anymore!

## Testing After Deployment

1. Visit your deployed site
2. Open DevTools (F12) → Console tab
3. Look for service worker logs:
   - `[Service Worker] Installing...`
   - `[Service Worker] Activating...`
   - `[Service Worker] Deleting old cache: sheets-pwa-static-v1`

4. Test the app:
   - Page should load fresh content immediately
   - Google Sheets integration should work
   - Static assets should load quickly from cache

## Future Deployments

When you make changes and deploy:

1. **Increment the cache version** in `public/sw.js`:
   ```javascript
   const CACHE_VERSION = 'v3'; // Change from v2 to v3
   ```

2. Build and deploy as usual
3. The service worker will automatically:
   - Install the new version
   - Delete old caches
   - Serve fresh content

## Troubleshooting

### If you still see old content:

1. **Unregister the old service worker**:
   - Open DevTools → Application tab → Service Workers
   - Click "Unregister" on any old service workers
   - Refresh the page

2. **Clear all caches manually**:
   - DevTools → Application tab → Storage
   - Click "Clear site data"
   - Refresh the page

3. **Check cache version**:
   - Make sure `CACHE_VERSION` was incremented
   - Rebuild the project

### Verify service worker is working:

```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations);
});
```

## Benefits of This Approach

✅ **No more blank pages** after deployment
✅ **Fresh content** always loaded for HTML
✅ **Fast performance** with cached static assets
✅ **Offline capability** maintained
✅ **Google Sheets API** never cached (always fresh data)
✅ **Automatic cache cleanup** prevents bloat
✅ **Immediate updates** with skipWaiting/claim

## Notes

- The service worker is registered in `src/main.tsx`
- It respects the `BASE_URL` from Vite config (`/sheets-pwa-main/`)
- All Google API calls bypass the service worker completely
- Console logs help debug caching behavior in production
