/**
 * StreetFlix - Transition Engine
 * Smooth transitions between Street View panoramas
 */

class TransitionEngine {
  constructor(streetViewController) {
    this.controller = streetViewController;
    this.overlay = null;
    this.canvas = null;
    this.isTransitioning = false;
    
    this.settings = {
      enabled: true,
      duration: 300,
      easing: 'ease-out',
      fadeOpacity: 0.8
    };
    
    this.createOverlay();
  }

  /**
   * Create overlay element for transitions
   */
  createOverlay() {
    this.overlay = DOMHelpers.createElement('div', {
      id: 'streetflix-transition-overlay',
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '9999',
        transition: `opacity ${this.settings.duration}ms ${this.settings.easing}`
      }
    });

    // Image overlay for frame captures
    this.imageOverlay = DOMHelpers.createElement('img', {
      id: 'streetflix-image-overlay',
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '9998',
        transition: `opacity ${this.settings.duration}ms ${this.settings.easing}`
      }
    });

    document.body.appendChild(this.imageOverlay);
    document.body.appendChild(this.overlay);
  }

  /**
   * Find the Street View canvas element
   */
  findCanvas() {
    if (this.canvas) return this.canvas;
    
    // Try different selectors
    const selectors = [
      'canvas.widget-scene-canvas',
      '.widget-scene canvas',
      'canvas[width="100%"]',
      '#scene canvas'
    ];

    for (const selector of selectors) {
      const canvas = document.querySelector(selector);
      if (canvas) {
        this.canvas = canvas;
        return canvas;
      }
    }

    // Fallback: find any large canvas
    const canvases = document.querySelectorAll('canvas');
    for (const c of canvases) {
      if (c.width > 500 && c.height > 300) {
        this.canvas = c;
        return c;
      }
    }

    return null;
  }

  /**
   * Capture current frame from canvas
   */
  captureFrame() {
    const canvas = this.findCanvas();
    if (!canvas) {
      console.warn('[StreetFlix] Could not find canvas for frame capture');
      return null;
    }

    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      // Canvas may be tainted (cross-origin)
      console.warn('[StreetFlix] Cannot capture frame (cross-origin):', e.message);
      return null;
    }
  }

  /**
   * Perform smooth transition to new position
   * @param {Object} targetPosition - {lat, lng}
   * @param {number} targetHeading - Heading in degrees
   */
  async transitionTo(targetPosition, targetHeading = null) {
    if (this.isTransitioning) {
      console.log('[StreetFlix] Transition already in progress');
      return false;
    }

    if (!this.settings.enabled) {
      // Just move without transition
      await this.controller.setPosition(targetPosition);
      if (targetHeading !== null) {
        await this.controller.setPov({ heading: targetHeading, pitch: 0 });
      }
      return true;
    }

    this.isTransitioning = true;

    try {
      // Step 1: Capture current frame
      const capturedFrame = this.captureFrame();

      // Step 2: Show captured frame as overlay
      if (capturedFrame) {
        this.imageOverlay.src = capturedFrame;
        this.imageOverlay.style.opacity = '1';
      } else {
        // Fallback: use black fade
        this.overlay.style.opacity = String(this.settings.fadeOpacity);
      }

      // Step 3: Wait a bit for overlay to appear
      await this.delay(50);

      // Step 4: Move Street View (hidden behind overlay)
      await this.controller.setPosition(targetPosition);
      
      // Step 5: Set heading if provided
      if (targetHeading !== null) {
        await this.controller.setPov({ heading: targetHeading, pitch: 0 });
      }

      // Step 6: Wait for new panorama to load
      await this.controller.waitForLoad(2000);
      
      // Small extra delay for render
      await this.delay(100);

      // Step 7: Fade out overlay
      this.imageOverlay.style.opacity = '0';
      this.overlay.style.opacity = '0';

      // Step 8: Wait for fade to complete
      await this.delay(this.settings.duration);

      return true;

    } catch (error) {
      console.error('[StreetFlix] Transition error:', error);
      this.imageOverlay.style.opacity = '0';
      this.overlay.style.opacity = '0';
      return false;

    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Animate heading change smoothly
   * @param {number} fromHeading - Starting heading
   * @param {number} toHeading - Target heading
   * @param {number} duration - Animation duration in ms
   */
  async animateHeading(fromHeading, toHeading, duration = 300) {
    const startTime = performance.now();
    const headingDiff = GeoUtils.normalizeHeadingDiff(fromHeading, toHeading);

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const currentHeading = fromHeading + (headingDiff * eased);
        this.controller.setPov({ heading: currentHeading, pitch: 0 });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Perform crossfade between two frames
   * @param {string} fromImage - Data URL of starting frame
   * @param {string} toImage - Data URL of ending frame
   * @param {number} duration - Transition duration in ms
   */
  async crossfade(fromImage, toImage, duration = 300) {
    // Create temporary image elements
    const fromEl = DOMHelpers.createElement('img', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: '9997',
        opacity: '1'
      }
    });
    fromEl.src = fromImage;

    const toEl = DOMHelpers.createElement('img', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: '9996',
        opacity: '0',
        transition: `opacity ${duration}ms ${this.settings.easing}`
      }
    });
    toEl.src = toImage;

    document.body.appendChild(fromEl);
    document.body.appendChild(toEl);

    // Trigger crossfade
    await this.delay(50);
    fromEl.style.transition = `opacity ${duration}ms ${this.settings.easing}`;
    fromEl.style.opacity = '0';
    toEl.style.opacity = '1';

    // Wait for transition
    await this.delay(duration);

    // Cleanup
    fromEl.remove();
    toEl.remove();
  }

  /**
   * Quick flash transition (faster, simpler)
   */
  async flashTransition() {
    this.overlay.style.transition = 'opacity 100ms ease-out';
    this.overlay.style.opacity = '0.5';
    await this.delay(100);
    this.overlay.style.opacity = '0';
    await this.delay(100);
    this.overlay.style.transition = `opacity ${this.settings.duration}ms ${this.settings.easing}`;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
    
    // Update overlay transition
    this.overlay.style.transition = `opacity ${this.settings.duration}ms ${this.settings.easing}`;
    this.imageOverlay.style.transition = `opacity ${this.settings.duration}ms ${this.settings.easing}`;
  }

  /**
   * Helper: Promise-based delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a transition is in progress
   */
  isBusy() {
    return this.isTransitioning;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.overlay) this.overlay.remove();
    if (this.imageOverlay) this.imageOverlay.remove();
  }
}

// Export
window.TransitionEngine = TransitionEngine;
