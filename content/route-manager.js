/**
 * StreetFlix - Route Manager
 * Handle route creation, waypoints, and navigation
 */

class RouteManager {
  constructor() {
    this.waypoints = [];
    this.currentIndex = 0;
    this.startPoint = null;
    this.endPoint = null;
    this.totalDistance = 0;
  }

  /**
   * Set route from array of coordinates
   * @param {Array} points - Array of {lat, lng} objects
   */
  setRoute(points) {
    this.waypoints = points;
    this.currentIndex = 0;
    
    if (points.length > 0) {
      this.startPoint = points[0];
      this.endPoint = points[points.length - 1];
    }
    
    this.preprocessRoute();
    this.totalDistance = GeoUtils.calculateRouteDistance(this.waypoints);
    
    console.log(`[StreetFlix] Route set with ${this.waypoints.length} waypoints, ${Math.round(this.totalDistance)}m total`);
  }

  /**
   * Add intermediate points for smoother movement
   */
  preprocessRoute() {
    if (this.waypoints.length < 2) return;

    const interpolated = [];
    const targetSpacing = 20; // meters between points

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const start = this.waypoints[i];
      const end = this.waypoints[i + 1];
      const distance = GeoUtils.calculateDistance(start, end);

      // Add start point
      interpolated.push(start);

      // Add intermediate points if segment is long enough
      if (distance > targetSpacing) {
        const steps = Math.ceil(distance / targetSpacing);
        for (let j = 1; j < steps; j++) {
          interpolated.push(GeoUtils.interpolate(start, end, j / steps));
        }
      }
    }

    // Add final point
    interpolated.push(this.waypoints[this.waypoints.length - 1]);
    
    this.waypoints = interpolated;
  }

  /**
   * Set start point from current position
   * @param {Object} position - {lat, lng}
   */
  setStartPoint(position) {
    this.startPoint = position;
    console.log('[StreetFlix] Start point set:', position);
  }

  /**
   * Set end point
   * @param {Object} position - {lat, lng}
   */
  setEndPoint(position) {
    this.endPoint = position;
    console.log('[StreetFlix] End point set:', position);
  }

  /**
   * Build route between start and end points
   * For now, creates direct line - could be enhanced with routing API
   */
  buildRoute() {
    if (!this.startPoint || !this.endPoint) {
      console.error('[StreetFlix] Cannot build route: missing start or end point');
      return false;
    }

    // Create simple direct route
    // TODO: Could use OpenRouteService or OSRM for real routing
    this.setRoute([this.startPoint, this.endPoint]);
    return true;
  }

  /**
   * Try to capture route from Google Maps directions
   */
  captureFromGoogleDirections() {
    console.log('[StreetFlix] Attempting to capture route from Google Directions...');

    // Method 1: Try to find polyline in URL
    const url = location.href;
    const polylineMatch = url.match(/data=[^&]*?4m[^&]*?([a-zA-Z0-9_-]+)/);
    
    // Method 2: Look for route overlay elements
    const routePath = document.querySelector('svg path[d*="M"]');
    
    // Method 3: Look for directions panel waypoints
    const directionSteps = document.querySelectorAll('[data-trip-index]');
    
    // Method 4: Check for encoded route in page scripts
    const scripts = document.querySelectorAll('script');
    let encodedRoute = null;
    
    scripts.forEach(script => {
      const content = script.textContent;
      if (content.includes('polyline') || content.includes('overview_path')) {
        // Try to extract polyline
        const match = content.match(/"points":"([^"]+)"/);
        if (match) {
          encodedRoute = match[1];
        }
      }
    });

    if (encodedRoute) {
      const points = GeoUtils.decodePolyline(encodedRoute);
      if (points.length > 0) {
        this.setRoute(points);
        return true;
      }
    }

    // Method 5: Extract from network requests (if we intercepted them)
    if (window._streetflixCapturedRoute) {
      this.setRoute(window._streetflixCapturedRoute);
      return true;
    }

    // Fallback: collect visible waypoints from DOM
    return this.captureFromDOM();
  }

  /**
   * Try to capture route points from DOM elements
   */
  captureFromDOM() {
    const points = [];

    // Look for markers or route points
    const markers = document.querySelectorAll('[data-marker-id], .directions-result');
    
    markers.forEach(marker => {
      // Try to extract coordinates from various attributes
      const lat = marker.dataset?.lat || marker.getAttribute('lat');
      const lng = marker.dataset?.lng || marker.getAttribute('lng');
      
      if (lat && lng) {
        points.push({
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        });
      }
    });

    if (points.length >= 2) {
      this.setRoute(points);
      return true;
    }

    console.log('[StreetFlix] Could not capture route from DOM');
    return false;
  }

  /**
   * Get current waypoint
   */
  getCurrentWaypoint() {
    if (this.currentIndex < this.waypoints.length) {
      return this.waypoints[this.currentIndex];
    }
    return null;
  }

  /**
   * Get next waypoint
   */
  getNextWaypoint() {
    if (this.currentIndex + 1 < this.waypoints.length) {
      return this.waypoints[this.currentIndex + 1];
    }
    return null;
  }

  /**
   * Get waypoint at specific index
   */
  getWaypoint(index) {
    if (index >= 0 && index < this.waypoints.length) {
      return this.waypoints[index];
    }
    return null;
  }

  /**
   * Advance to next waypoint
   * @returns {boolean} Whether there are more waypoints
   */
  advance() {
    if (this.currentIndex < this.waypoints.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  /**
   * Go back one waypoint
   */
  goBack() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  /**
   * Jump to specific waypoint index
   */
  jumpTo(index) {
    if (index >= 0 && index < this.waypoints.length) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }

  /**
   * Jump to percentage of route
   */
  jumpToPercent(percent) {
    const index = Math.floor((percent / 100) * (this.waypoints.length - 1));
    return this.jumpTo(index);
  }

  /**
   * Get heading to next waypoint
   */
  getHeadingToNext() {
    const current = this.getCurrentWaypoint();
    const next = this.getNextWaypoint();
    
    if (current && next) {
      return GeoUtils.calculateHeading(current, next);
    }
    return 0;
  }

  /**
   * Get progress as percentage
   */
  getProgress() {
    if (this.waypoints.length <= 1) return 0;
    return (this.currentIndex / (this.waypoints.length - 1)) * 100;
  }

  /**
   * Get distance traveled
   */
  getDistanceTraveled() {
    let traveled = 0;
    for (let i = 0; i < this.currentIndex && i < this.waypoints.length - 1; i++) {
      traveled += GeoUtils.calculateDistance(this.waypoints[i], this.waypoints[i + 1]);
    }
    return traveled;
  }

  /**
   * Get remaining distance
   */
  getRemainingDistance() {
    return this.totalDistance - this.getDistanceTraveled();
  }

  /**
   * Check if route is complete
   */
  isComplete() {
    return this.currentIndex >= this.waypoints.length - 1;
  }

  /**
   * Check if route has waypoints
   */
  hasRoute() {
    return this.waypoints.length > 1;
  }

  /**
   * Reset route to beginning
   */
  reset() {
    this.currentIndex = 0;
  }

  /**
   * Clear route
   */
  clear() {
    this.waypoints = [];
    this.currentIndex = 0;
    this.startPoint = null;
    this.endPoint = null;
    this.totalDistance = 0;
  }

  /**
   * Export route as JSON
   */
  toJSON() {
    return {
      waypoints: this.waypoints,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      totalDistance: this.totalDistance
    };
  }

  /**
   * Import route from JSON
   */
  fromJSON(data) {
    if (data.waypoints) {
      this.setRoute(data.waypoints);
    }
  }

  /**
   * Get route info summary
   */
  getInfo() {
    return {
      start: this.startPoint ? 
        `${this.startPoint.lat.toFixed(4)}, ${this.startPoint.lng.toFixed(4)}` : 'Not set',
      end: this.endPoint ?
        `${this.endPoint.lat.toFixed(4)}, ${this.endPoint.lng.toFixed(4)}` : 'Not set',
      waypointCount: this.waypoints.length,
      totalDistance: Math.round(this.totalDistance),
      progress: Math.round(this.getProgress())
    };
  }
}

// Export
window.RouteManager = RouteManager;
