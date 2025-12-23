/**
 * StreetFlix - Geometry Utilities
 * Geographic calculations for routing and navigation
 */

const GeoUtils = {
  /**
   * Calculate heading (bearing) from point A to point B
   * @param {Object} from - {lat, lng}
   * @param {Object} to - {lat, lng}
   * @returns {number} Heading in degrees (0-360)
   */
  calculateHeading(from, to) {
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    const dLng = this.toRad(to.lng - from.lng);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let heading = Math.atan2(y, x);
    heading = this.toDeg(heading);
    heading = (heading + 360) % 360;

    return heading;
  },

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Object} from - {lat, lng}
   * @param {Object} to - {lat, lng}
   * @returns {number} Distance in meters
   */
  calculateDistance(from, to) {
    const R = 6371000; // Earth's radius in meters
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Interpolate between two points
   * @param {Object} from - {lat, lng}
   * @param {Object} to - {lat, lng}
   * @param {number} t - Interpolation factor (0 to 1)
   * @returns {Object} Interpolated point {lat, lng}
   */
  interpolate(from, to, t) {
    return {
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t
    };
  },

  /**
   * Normalize heading difference to -180 to 180 range
   * @param {number} from - Starting heading
   * @param {number} to - Target heading
   * @returns {number} Normalized difference
   */
  normalizeHeadingDiff(from, to) {
    let diff = to - from;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  },

  /**
   * Smoothly interpolate between two headings
   * @param {number} from - Starting heading
   * @param {number} to - Target heading
   * @param {number} t - Interpolation factor (0 to 1)
   * @returns {number} Interpolated heading
   */
  interpolateHeading(from, to, t) {
    const diff = this.normalizeHeadingDiff(from, to);
    let result = from + diff * t;
    return (result + 360) % 360;
  },

  /**
   * Calculate total distance of a route
   * @param {Array} waypoints - Array of {lat, lng} points
   * @returns {number} Total distance in meters
   */
  calculateRouteDistance(waypoints) {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return total;
  },

  /**
   * Find the closest point on a route to a given position
   * @param {Object} position - {lat, lng}
   * @param {Array} waypoints - Array of {lat, lng} points
   * @returns {number} Index of closest waypoint
   */
  findClosestWaypoint(position, waypoints) {
    let minDist = Infinity;
    let closestIdx = 0;

    waypoints.forEach((wp, idx) => {
      const dist = this.calculateDistance(position, wp);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    return closestIdx;
  },

  /**
   * Decode a Google polyline string to coordinates
   * @param {string} encoded - Encoded polyline string
   * @returns {Array} Array of {lat, lng} points
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return points;
  },

  /**
   * Convert degrees to radians
   */
  toRad(deg) {
    return deg * Math.PI / 180;
  },

  /**
   * Convert radians to degrees
   */
  toDeg(rad) {
    return rad * 180 / Math.PI;
  }
};

// Export for use in other scripts
window.GeoUtils = GeoUtils;
