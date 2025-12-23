/**
 * StreetFlix - Street View Controller
 * Interface with Google Maps Street View
 */

class StreetViewController {
  constructor() {
    this.panorama = null;
    this.isReady = false;
    this.listeners = new Map();
    this.pollInterval = null;
  }

  /**
   * Initialize and find the Street View panorama object
   */
  async initialize() {
    console.log('[StreetFlix] Initializing Street View Controller...');
    
    try {
      // Try multiple methods to find the panorama
      await this.findPanorama();
      
      if (this.panorama) {
        this.isReady = true;
        console.log('[StreetFlix] Street View Controller ready');
        return true;
      }
    } catch (error) {
      console.error('[StreetFlix] Init error:', error);
    }

    // Start polling if not found immediately
    this.startPolling();
    return false;
  }

  /**
   * Attempt to find the panorama object using various methods
   */
  async findPanorama() {
    // Method 1: Check for google.maps global
    if (window.google?.maps) {
      console.log('[StreetFlix] Found google.maps');
      
      // Try to find StreetViewPanorama instances
      if (window.google.maps.streetViewPanorama) {
        this.panorama = window.google.maps.streetViewPanorama;
        return;
      }
    }

    // Method 2: Look for panorama in the DOM via data attributes
    const svContainer = document.querySelector('[data-panoid]');
    if (svContainer) {
      console.log('[StreetFlix] Found Street View container with panoid');
    }

    // Method 3: Find canvas and traverse React fiber
    const canvas = document.querySelector('canvas.widget-scene-canvas');
    if (canvas) {
      const pano = this.findPanoramaFromCanvas(canvas);
      if (pano) {
        this.panorama = pano;
        return;
      }
    }

    // Method 4: Hook into Google's internal event system
    await this.hookIntoMapsEvents();
  }

  /**
   * Find panorama object by traversing from canvas element
   */
  findPanoramaFromCanvas(canvas) {
    // Look for React fiber
    const fiberKey = Object.keys(canvas).find(k => 
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    
    if (fiberKey) {
      console.log('[StreetFlix] Found React fiber on canvas');
      // Traverse fiber tree to find panorama state
      // This is fragile and may need updates
    }

    return null;
  }

  /**
   * Hook into Google Maps events to capture panorama
   */
  async hookIntoMapsEvents() {
    return new Promise((resolve) => {
      // Intercept XHR to detect panorama loads
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (url.includes('photometa') || url.includes('streetviewpixels')) {
          console.log('[StreetFlix] Detected Street View request:', url);
        }
        return originalOpen.apply(this, arguments);
      };

      // Also check URL changes
      this.observeURLChanges();
      
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Observe URL changes to detect Street View mode
   */
  observeURLChanges() {
    let lastURL = location.href;
    
    const checkURL = () => {
      if (location.href !== lastURL) {
        lastURL = location.href;
        this.onURLChange(lastURL);
      }
    };

    // Check periodically and on popstate
    setInterval(checkURL, 500);
    window.addEventListener('popstate', checkURL);
  }

  /**
   * Handle URL changes
   */
  onURLChange(url) {
    const isStreetView = this.isStreetViewURL(url);
    console.log('[StreetFlix] URL changed, Street View:', isStreetView);
    
    if (isStreetView && !this.isReady) {
      this.findPanorama();
    }
  }

  /**
   * Check if URL indicates Street View mode
   */
  isStreetViewURL(url = location.href) {
    // Street View URLs contain @lat,lng,3a (3a indicates street view)
    return url.includes(',3a,') || url.includes('!1s') || url.includes('layer=c');
  }

  /**
   * Check if currently in Street View
   */
  isInStreetView() {
    // Check URL
    if (this.isStreetViewURL()) {
      return true;
    }

    // Check for Street View canvas
    const svCanvas = document.querySelector('canvas.widget-scene-canvas');
    if (svCanvas && svCanvas.offsetParent !== null) {
      return true;
    }

    // Check for Street View specific elements
    const svElements = document.querySelectorAll('[data-panoid], .widget-scene');
    return svElements.length > 0;
  }

  /**
   * Start polling for panorama if not found initially
   */
  startPolling() {
    if (this.pollInterval) return;

    console.log('[StreetFlix] Starting panorama polling...');
    
    this.pollInterval = setInterval(async () => {
      if (this.isInStreetView() && !this.isReady) {
        await this.findPanorama();
        
        if (this.panorama) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          this.isReady = true;
          this.emit('ready');
        }
      }
    }, 1000);
  }

  /**
   * Get current position
   */
  getPosition() {
    // Parse from URL if direct access not available
    const url = location.href;
    const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }

    // Try direct panorama access
    if (this.panorama?.getPosition) {
      const pos = this.panorama.getPosition();
      return { lat: pos.lat(), lng: pos.lng() };
    }

    return null;
  }

  /**
   * Get current point of view (heading, pitch, zoom)
   */
  getPov() {
    // Parse from URL
    const url = location.href;
    const headingMatch = url.match(/,(\d+\.?\d*)h/);
    const pitchMatch = url.match(/,(\d+\.?\d*)t/);
    
    const heading = headingMatch ? parseFloat(headingMatch[1]) : 0;
    const pitch = pitchMatch ? parseFloat(pitchMatch[1]) - 90 : 0;

    if (this.panorama?.getPov) {
      const pov = this.panorama.getPov();
      return { heading: pov.heading, pitch: pov.pitch, zoom: pov.zoom || 1 };
    }

    return { heading, pitch, zoom: 1 };
  }

  /**
   * Get current panorama ID
   */
  getPanoId() {
    // Try from URL
    const url = location.href;
    const match = url.match(/!1s([^!]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    // Try from DOM
    const container = document.querySelector('[data-panoid]');
    if (container) {
      return container.dataset.panoid;
    }

    if (this.panorama?.getPano) {
      return this.panorama.getPano();
    }

    return null;
  }

  /**
   * Set position (navigate to new location)
   */
  async setPosition(latLng) {
    console.log('[StreetFlix] Setting position:', latLng);

    // Method 1: Direct panorama API
    if (this.panorama?.setPosition) {
      this.panorama.setPosition(latLng);
      return true;
    }

    // Method 2: Navigate via URL
    return this.navigateViaURL(latLng);
  }

  /**
   * Navigate to position by updating URL
   */
  navigateViaURL(latLng, heading = null, pitch = null) {
    const currentPov = this.getPov();
    const h = heading ?? currentPov.heading;
    const p = (pitch ?? currentPov.pitch) + 90; // Convert to URL format

    // Construct Street View URL
    const url = `https://www.google.com/maps/@${latLng.lat},${latLng.lng},3a,75y,${h}h,${p}t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    
    // Use history API to avoid full page reload
    history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));

    return true;
  }

  /**
   * Set point of view (heading/pitch)
   */
  async setPov(pov) {
    if (this.panorama?.setPov) {
      this.panorama.setPov(pov);
      return true;
    }

    // Update via URL
    const pos = this.getPosition();
    if (pos) {
      return this.navigateViaURL(pos, pov.heading, pov.pitch);
    }

    return false;
  }

  /**
   * Get available navigation links (adjacent panoramas)
   */
  getLinks() {
    if (this.panorama?.getLinks) {
      return this.panorama.getLinks().map(link => ({
        heading: link.heading,
        pano: link.pano,
        description: link.description
      }));
    }

    // Try to find navigation arrows in DOM
    const arrows = document.querySelectorAll('[data-control-name="pegmanArrow"]');
    return Array.from(arrows).map(arrow => {
      const style = arrow.style.transform;
      const match = style.match(/rotate\((\d+)deg\)/);
      return {
        heading: match ? parseFloat(match[1]) : 0,
        element: arrow
      };
    });
  }

  /**
   * Click the navigation arrow closest to target heading
   */
  clickNavigationArrow(targetHeading) {
    const links = this.getLinks();
    if (!links.length) return false;

    // Find closest arrow
    let closest = links[0];
    let minDiff = 360;

    links.forEach(link => {
      const diff = Math.abs(GeoUtils.normalizeHeadingDiff(link.heading, targetHeading));
      if (diff < minDiff) {
        minDiff = diff;
        closest = link;
      }
    });

    // Click the arrow
    if (closest.element) {
      closest.element.click();
      return true;
    }

    return false;
  }

  /**
   * Wait for panorama to load
   */
  waitForLoad(timeout = 5000) {
    return new Promise((resolve) => {
      if (this.panorama?.getStatus) {
        const checkStatus = () => {
          const status = this.panorama.getStatus();
          if (status === 'OK' || status === google.maps.StreetViewStatus.OK) {
            resolve(true);
            return true;
          }
          return false;
        };

        if (checkStatus()) return;

        const interval = setInterval(() => {
          if (checkStatus()) {
            clearInterval(interval);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
          resolve(false);
        }, timeout);
      } else {
        // Fallback: wait for DOM stability
        setTimeout(() => resolve(true), 1000);
      }
    });
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.listeners.clear();
  }
}

// Export
window.StreetViewController = StreetViewController;
