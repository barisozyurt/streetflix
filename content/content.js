/**
 * StreetFlix - Main Content Script
 * Orchestrates all components for Street View automation
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.StreetFlix) {
    console.log('[StreetFlix] Already initialized');
    return;
  }

  class StreetFlixController {
    constructor() {
      this.streetView = null;
      this.route = null;
      this.transitions = null;
      this.cache = null;

      this.isPlaying = false;
      this.isPaused = false;
      this.speed = 'cycling';
      this.playbackTimer = null;

      // Speed settings (interval between moves in ms)
      this.speeds = {
        walking: 2500,    // ~5 km/h feel
        cycling: 1200,    // ~15 km/h feel
        driving: 600,     // ~50 km/h feel
        flying: 250       // Fast preview
      };

      this.settings = {
        smoothTransitions: true,
        transitionSpeed: 300,
        autoHeading: true
      };

      console.log('[StreetFlix] Initializing...');
      this.init();
    }

    async init() {
      try {
        // Initialize components
        this.streetView = new StreetViewController();
        this.route = new RouteManager();
        this.cache = new CacheManager();

        await this.streetView.initialize();
        
        this.transitions = new TransitionEngine(this.streetView);

        // Set up message listener
        this.setupMessageListener();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Create floating UI
        this.createFloatingUI();

        console.log('[StreetFlix] Ready!');
        
        // Notify popup
        this.sendStatusUpdate();

      } catch (error) {
        console.error('[StreetFlix] Initialization failed:', error);
      }
    }

    /**
     * Set up Chrome message listener
     */
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[StreetFlix] Received message:', message.action);

        switch (message.action) {
          case 'getStatus':
            sendResponse(this.getStatus());
            break;

          case 'setPoint':
            const position = this.streetView.getPosition();
            if (position) {
              if (message.type === 'start') {
                this.route.setStartPoint(position);
              } else {
                this.route.setEndPoint(position);
              }
              this.route.buildRoute();
              sendResponse({ 
                success: true, 
                location: `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`,
                waypointCount: this.route.waypoints.length
              });
            } else {
              sendResponse({ success: false, error: 'Could not get position' });
            }
            break;

          case 'captureRoute':
            const captured = this.route.captureFromGoogleDirections();
            if (captured) {
              sendResponse({ 
                success: true, 
                ...this.route.getInfo()
              });
            } else {
              sendResponse({ success: false, error: 'Could not capture route' });
            }
            break;

          case 'setSpeed':
            this.speed = message.speed;
            sendResponse({ success: true });
            break;

          case 'play':
            this.play();
            sendResponse({ success: true });
            break;

          case 'pause':
            this.pause();
            sendResponse({ success: true });
            break;

          case 'stop':
            this.stop();
            sendResponse({ success: true });
            break;

          case 'updateSettings':
            this.updateSettings(message);
            sendResponse({ success: true });
            break;

          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }

        return true; // Keep message channel open for async responses
      });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Only handle if not in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        switch (e.code) {
          case 'Space':
            e.preventDefault();
            if (this.isPlaying) {
              this.pause();
            } else {
              this.play();
            }
            break;

          case 'ArrowRight':
            if (e.shiftKey) {
              this.skip(10);
            } else {
              this.skip(1);
            }
            break;

          case 'ArrowLeft':
            if (e.shiftKey) {
              this.skip(-10);
            } else {
              this.skip(-1);
            }
            break;

          case 'ArrowUp':
            e.preventDefault();
            this.speedUp();
            break;

          case 'ArrowDown':
            e.preventDefault();
            this.slowDown();
            break;

          case 'Escape':
            this.stop();
            break;

          case 'KeyF':
            this.toggleFullscreen();
            break;
        }
      });
    }

    /**
     * Create floating control UI
     */
    createFloatingUI() {
      const ui = DOMHelpers.createElement('div', {
        id: 'streetflix-controls',
        style: {
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'none',
          alignItems: 'center',
          gap: '16px',
          zIndex: '10000',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }
      });

      // Logo
      const logo = DOMHelpers.createElement('span', {
        style: { fontSize: '16px', fontWeight: 'bold', color: '#e50914' }
      }, '🎬 StreetFlix');

      // Progress
      const progress = DOMHelpers.createElement('div', {
        id: 'sf-progress-container',
        style: {
          width: '200px',
          height: '6px',
          backgroundColor: '#333',
          borderRadius: '3px',
          overflow: 'hidden'
        }
      });

      const progressBar = DOMHelpers.createElement('div', {
        id: 'sf-progress-bar',
        style: {
          width: '0%',
          height: '100%',
          backgroundColor: '#e50914',
          transition: 'width 0.3s ease'
        }
      });
      progress.appendChild(progressBar);

      // Play/Pause button
      const playBtn = DOMHelpers.createElement('button', {
        id: 'sf-play-btn',
        style: {
          backgroundColor: '#e50914',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        onClick: () => this.isPlaying ? this.pause() : this.play()
      }, '▶️');

      // Stop button
      const stopBtn = DOMHelpers.createElement('button', {
        id: 'sf-stop-btn',
        style: {
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#fff'
        },
        onClick: () => this.stop()
      }, '⏹️');

      // Speed indicator
      const speedLabel = DOMHelpers.createElement('span', {
        id: 'sf-speed',
        style: { color: '#999', fontSize: '12px' }
      }, '🚴 Bike');

      ui.appendChild(logo);
      ui.appendChild(progress);
      ui.appendChild(playBtn);
      ui.appendChild(stopBtn);
      ui.appendChild(speedLabel);

      document.body.appendChild(ui);
      this.floatingUI = ui;
    }

    /**
     * Update floating UI
     */
    updateFloatingUI() {
      if (!this.floatingUI) return;

      const progressBar = document.getElementById('sf-progress-bar');
      const playBtn = document.getElementById('sf-play-btn');
      const speedLabel = document.getElementById('sf-speed');

      if (progressBar) {
        progressBar.style.width = `${this.route.getProgress()}%`;
      }

      if (playBtn) {
        playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
      }

      if (speedLabel) {
        const icons = { walking: '🚶', cycling: '🚴', driving: '🚗', flying: '✈️' };
        const labels = { walking: 'Walk', cycling: 'Bike', driving: 'Drive', flying: 'Fly' };
        speedLabel.textContent = `${icons[this.speed]} ${labels[this.speed]}`;
      }
    }

    /**
     * Show/hide floating UI
     */
    showFloatingUI(show = true) {
      if (this.floatingUI) {
        this.floatingUI.style.display = show ? 'flex' : 'none';
      }
    }

    /**
     * Start playback
     */
    async play() {
      if (!this.route.hasRoute()) {
        console.warn('[StreetFlix] No route set');
        return;
      }

      if (this.isPlaying) {
        return;
      }

      console.log('[StreetFlix] Starting playback');
      this.isPlaying = true;
      this.isPaused = false;
      this.showFloatingUI(true);
      this.updateFloatingUI();
      this.sendStatusUpdate();

      this.advanceFrame();
    }

    /**
     * Advance to next frame
     */
    async advanceFrame() {
      if (!this.isPlaying || this.isPaused) {
        return;
      }

      const current = this.route.getCurrentWaypoint();
      const next = this.route.getNextWaypoint();

      if (!next) {
        console.log('[StreetFlix] Route complete');
        this.stop();
        return;
      }

      // Pre-cache upcoming panoramas
      this.cache.precacheRoute(this.route.waypoints, this.route.currentIndex);

      // Calculate heading
      const heading = this.settings.autoHeading ? this.route.getHeadingToNext() : null;

      // Transition to next point
      const success = await this.transitions.transitionTo(next, heading);

      if (success) {
        this.route.advance();
        this.updateFloatingUI();
        this.sendProgressUpdate();
      }

      // Schedule next frame
      if (this.isPlaying && !this.isPaused) {
        const interval = this.speeds[this.speed] || this.speeds.cycling;
        this.playbackTimer = setTimeout(() => this.advanceFrame(), interval);
      }
    }

    /**
     * Pause playback
     */
    pause() {
      console.log('[StreetFlix] Paused');
      this.isPaused = true;
      this.isPlaying = false;
      
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
        this.playbackTimer = null;
      }

      this.updateFloatingUI();
      this.sendStatusUpdate();
    }

    /**
     * Stop playback
     */
    stop() {
      console.log('[StreetFlix] Stopped');
      this.isPlaying = false;
      this.isPaused = false;

      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
        this.playbackTimer = null;
      }

      this.route.reset();
      this.showFloatingUI(false);
      this.sendStatusUpdate();
    }

    /**
     * Skip forward/backward
     */
    skip(frames) {
      const newIndex = Math.max(0, Math.min(
        this.route.waypoints.length - 1,
        this.route.currentIndex + frames
      ));
      
      this.route.jumpTo(newIndex);
      
      const waypoint = this.route.getCurrentWaypoint();
      if (waypoint) {
        const heading = this.route.getHeadingToNext();
        this.transitions.transitionTo(waypoint, heading);
      }

      this.updateFloatingUI();
    }

    /**
     * Speed up
     */
    speedUp() {
      const speedOrder = ['walking', 'cycling', 'driving', 'flying'];
      const currentIdx = speedOrder.indexOf(this.speed);
      if (currentIdx < speedOrder.length - 1) {
        this.speed = speedOrder[currentIdx + 1];
        this.updateFloatingUI();
      }
    }

    /**
     * Slow down
     */
    slowDown() {
      const speedOrder = ['walking', 'cycling', 'driving', 'flying'];
      const currentIdx = speedOrder.indexOf(this.speed);
      if (currentIdx > 0) {
        this.speed = speedOrder[currentIdx - 1];
        this.updateFloatingUI();
      }
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
      Object.assign(this.settings, settings);
      
      if (this.transitions) {
        this.transitions.updateSettings({
          enabled: settings.smoothTransitions,
          duration: settings.transitionSpeed
        });
      }
    }

    /**
     * Get current status
     */
    getStatus() {
      return {
        inStreetView: this.streetView?.isInStreetView() ?? false,
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        progress: this.route?.getProgress() ?? 0,
        speed: this.speed,
        hasRoute: this.route?.hasRoute() ?? false,
        routeInfo: this.route?.getInfo() ?? null
      };
    }

    /**
     * Send status update to popup
     */
    sendStatusUpdate() {
      chrome.runtime.sendMessage({
        type: 'status',
        data: this.getStatus()
      }).catch(() => {}); // Ignore if popup not open
    }

    /**
     * Send progress update
     */
    sendProgressUpdate() {
      chrome.runtime.sendMessage({
        type: 'progress',
        progress: this.route.getProgress()
      }).catch(() => {});
    }
  }

  // Initialize StreetFlix
  window.StreetFlix = new StreetFlixController();

})();
