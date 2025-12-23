/**
 * StreetFlix - Cache Manager
 * Pre-load panorama tiles for smooth playback
 */

class CacheManager {
  constructor() {
    this.cached = new Set();
    this.loading = new Set();
    this.cacheAhead = 5; // Number of panoramas to pre-cache
    this.maxCacheSize = 50;
    this.tileCache = new Map();
  }

  /**
   * Pre-cache upcoming panoramas for a route
   * @param {Array} waypoints - Array of {lat, lng} points
   * @param {number} currentIndex - Current position in route
   */
  async precacheRoute(waypoints, currentIndex) {
    const upcoming = waypoints.slice(currentIndex, currentIndex + this.cacheAhead);
    
    for (const point of upcoming) {
      const key = this.getPointKey(point);
      if (!this.cached.has(key) && !this.loading.has(key)) {
        this.precachePoint(point);
      }
    }
  }

  /**
   * Pre-cache tiles for a specific point
   * @param {Object} point - {lat, lng}
   */
  async precachePoint(point) {
    const key = this.getPointKey(point);
    
    if (this.cached.has(key) || this.loading.has(key)) {
      return;
    }

    this.loading.add(key);
    
    try {
      // Try to get pano ID for this location
      const panoId = await this.findNearestPanoId(point);
      
      if (panoId) {
        await this.precachePanorama(panoId);
        this.cached.add(key);
      }
    } catch (error) {
      console.warn('[StreetFlix] Precache failed for', point, error);
    } finally {
      this.loading.delete(key);
    }

    // Manage cache size
    this.trimCache();
  }

  /**
   * Pre-cache tiles for a specific panorama ID
   * @param {string} panoId - Panorama ID
   */
  async precachePanorama(panoId) {
    if (!panoId) return;

    const tileUrls = this.getPanoramaTileUrls(panoId);
    const promises = tileUrls.map(url => this.preloadImage(url));
    
    await Promise.allSettled(promises);
    console.log(`[StreetFlix] Precached panorama ${panoId.slice(0, 8)}...`);
  }

  /**
   * Generate tile URLs for a panorama
   * Note: These URLs are based on observed patterns and may change
   * @param {string} panoId - Panorama ID
   * @returns {Array} Array of tile URLs
   */
  getPanoramaTileUrls(panoId) {
    const urls = [];
    
    // Google Street View tiles are typically loaded from:
    // https://streetviewpixels-pa.googleapis.com/v1/tile
    // With parameters for panoid, x, y, zoom level
    
    // For basic precaching, we'll generate center tiles
    // Zoom levels: 0-5 typically, 3 is a good balance
    const zoom = 3;
    const tilesPerSide = Math.pow(2, zoom);
    
    // Pre-cache center tiles (what user likely sees)
    const centerTiles = [
      { x: Math.floor(tilesPerSide / 2), y: Math.floor(tilesPerSide / 2) },
      { x: Math.floor(tilesPerSide / 2) + 1, y: Math.floor(tilesPerSide / 2) },
      { x: Math.floor(tilesPerSide / 2) - 1, y: Math.floor(tilesPerSide / 2) },
    ];

    for (const tile of centerTiles) {
      // Base tile URL pattern (this is approximate)
      const url = `https://streetviewpixels-pa.googleapis.com/v1/tile?` +
        `panoid=${encodeURIComponent(panoId)}&x=${tile.x}&y=${tile.y}&zoom=${zoom}`;
      urls.push(url);
    }

    return urls;
  }

  /**
   * Find nearest panorama ID for a location
   * @param {Object} point - {lat, lng}
   * @returns {Promise<string|null>} Panorama ID or null
   */
  async findNearestPanoId(point) {
    // Method 1: Try Google's internal API if available
    if (window.google?.maps?.StreetViewService) {
      try {
        const service = new google.maps.StreetViewService();
        const result = await new Promise((resolve, reject) => {
          service.getPanorama({
            location: point,
            radius: 50,
            source: google.maps.StreetViewSource.OUTDOOR
          }, (data, status) => {
            if (status === 'OK' && data) {
              resolve(data.location.pano);
            } else {
              reject(new Error(status));
            }
          });
        });
        return result;
      } catch (e) {
        // Service not available or no panorama found
      }
    }

    // Method 2: Parse from current page if near target
    const currentPanoId = this.getCurrentPanoId();
    if (currentPanoId) {
      return currentPanoId;
    }

    return null;
  }

  /**
   * Get current panorama ID from page
   */
  getCurrentPanoId() {
    // Try URL
    const url = location.href;
    const match = url.match(/!1s([^!]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    // Try DOM
    const container = document.querySelector('[data-panoid]');
    if (container) {
      return container.dataset.panoid;
    }

    return null;
  }

  /**
   * Preload an image URL
   * @param {string} url - Image URL
   * @returns {Promise<boolean>}
   */
  preloadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.tileCache.set(url, true);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Get cache key for a point
   */
  getPointKey(point) {
    // Round to 5 decimal places (~1m precision)
    return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
  }

  /**
   * Trim cache to max size
   */
  trimCache() {
    if (this.cached.size > this.maxCacheSize) {
      const toRemove = this.cached.size - this.maxCacheSize;
      const iterator = this.cached.values();
      
      for (let i = 0; i < toRemove; i++) {
        const key = iterator.next().value;
        this.cached.delete(key);
      }
    }
  }

  /**
   * Check if a point is cached
   */
  isCached(point) {
    return this.cached.has(this.getPointKey(point));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cachedPoints: this.cached.size,
      cachedTiles: this.tileCache.size,
      loading: this.loading.size
    };
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cached.clear();
    this.loading.clear();
    this.tileCache.clear();
  }

  /**
   * Set cache-ahead distance
   */
  setCacheAhead(count) {
    this.cacheAhead = Math.max(1, Math.min(20, count));
  }
}

// Export
window.CacheManager = CacheManager;
