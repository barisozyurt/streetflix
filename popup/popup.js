/**
 * StreetFlix - Popup Controller
 * Handles UI interactions and communicates with content script
 */

class PopupController {
  constructor() {
    this.currentSpeed = 'cycling';
    this.isPlaying = false;
    this.hasRoute = false;
    
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadState();
    this.checkStreetViewStatus();
  }

  bindElements() {
    // Status
    this.statusBadge = document.getElementById('status-badge');
    this.statusMessage = document.getElementById('status-message');
    this.statusText = document.getElementById('status-text');

    // Route
    this.btnSetStart = document.getElementById('btn-set-start');
    this.btnSetEnd = document.getElementById('btn-set-end');
    this.btnCaptureRoute = document.getElementById('btn-capture-route');
    this.routeInfo = document.getElementById('route-info');
    this.startPoint = document.getElementById('start-point');
    this.endPoint = document.getElementById('end-point');
    this.waypointCount = document.getElementById('waypoint-count');

    // Speed
    this.speedBtns = document.querySelectorAll('.speed-btn');

    // Playback
    this.btnPlay = document.getElementById('btn-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnStop = document.getElementById('btn-stop');

    // Progress
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');

    // Settings
    this.settingsToggle = document.getElementById('settings-toggle');
    this.settingsContent = document.getElementById('settings-content');
    this.smoothTransitions = document.getElementById('smooth-transitions');
    this.transitionSpeed = document.getElementById('transition-speed');
    this.transitionValue = document.getElementById('transition-value');
    this.autoHeading = document.getElementById('auto-heading');
  }

  bindEvents() {
    // Route buttons
    this.btnSetStart.addEventListener('click', () => this.setPoint('start'));
    this.btnSetEnd.addEventListener('click', () => this.setPoint('end'));
    this.btnCaptureRoute.addEventListener('click', () => this.captureRoute());

    // Speed buttons
    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => this.setSpeed(btn.dataset.speed));
    });

    // Playback buttons
    this.btnPlay.addEventListener('click', () => this.play());
    this.btnPause.addEventListener('click', () => this.pause());
    this.btnStop.addEventListener('click', () => this.stop());

    // Settings toggle
    this.settingsToggle.addEventListener('click', () => this.toggleSettings());

    // Settings changes
    this.transitionSpeed.addEventListener('input', (e) => {
      this.transitionValue.textContent = `${e.target.value}ms`;
      this.updateSettings();
    });

    this.smoothTransitions.addEventListener('change', () => this.updateSettings());
    this.autoHeading.addEventListener('change', () => this.updateSettings());

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((msg, sender, respond) => {
      this.handleMessage(msg);
    });
  }

  async sendMessage(action, data = {}) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        this.showStatus('No active tab found', 'error');
        return null;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action, ...data });
      return response;
    } catch (error) {
      console.error('Message error:', error);
      this.showStatus('Cannot connect to Google Maps. Make sure you\'re on a Maps page.', 'error');
      return null;
    }
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'status':
        this.updateStatus(msg.data);
        break;
      case 'progress':
        this.updateProgress(msg.progress);
        break;
      case 'routeUpdate':
        this.updateRouteInfo(msg.data);
        break;
      case 'playbackState':
        this.updatePlaybackState(msg.state);
        break;
    }
  }

  async checkStreetViewStatus() {
    const response = await this.sendMessage('getStatus');
    if (response) {
      this.updateStatus(response);
    }
  }

  async setPoint(type) {
    this.showStatus(`Setting ${type} point...`);
    const response = await this.sendMessage('setPoint', { type });
    
    if (response?.success) {
      if (type === 'start') {
        this.startPoint.textContent = response.location || 'Set';
      } else {
        this.endPoint.textContent = response.location || 'Set';
      }
      this.routeInfo.classList.remove('hidden');
      this.showStatus(`${type === 'start' ? 'Start' : 'End'} point set!`, 'success');
    }
  }

  async captureRoute() {
    this.showStatus('Capturing route from Google Directions...');
    const response = await this.sendMessage('captureRoute');
    
    if (response?.success) {
      this.updateRouteInfo(response);
      this.showStatus(`Route captured! ${response.waypointCount} waypoints`, 'success');
    } else {
      this.showStatus(response?.error || 'Could not capture route. Make sure directions are visible.', 'error');
    }
  }

  setSpeed(speed) {
    this.currentSpeed = speed;
    this.speedBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.speed === speed);
    });
    this.sendMessage('setSpeed', { speed });
  }

  async play() {
    const response = await this.sendMessage('play');
    if (response?.success) {
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    }
  }

  async pause() {
    const response = await this.sendMessage('pause');
    if (response?.success) {
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    }
  }

  async stop() {
    const response = await this.sendMessage('stop');
    if (response?.success) {
      this.isPlaying = false;
      this.updatePlaybackState('stopped');
      this.updateProgress(0);
    }
  }

  updatePlaybackState(state) {
    this.btnPlay.disabled = state === 'playing';
    this.btnPause.disabled = state !== 'playing';
    this.btnStop.disabled = state === 'stopped' || !this.hasRoute;

    // Update badge
    this.statusBadge.className = 'badge';
    switch (state) {
      case 'playing':
        this.statusBadge.classList.add('badge-playing');
        this.statusBadge.textContent = 'Playing';
        break;
      case 'paused':
        this.statusBadge.classList.add('badge-paused');
        this.statusBadge.textContent = 'Paused';
        break;
      default:
        this.statusBadge.classList.add('badge-idle');
        this.statusBadge.textContent = this.hasRoute ? 'Ready' : 'Idle';
    }
  }

  updateProgress(progress) {
    this.progressFill.style.width = `${progress}%`;
    this.progressText.textContent = `${Math.round(progress)}%`;
  }

  updateRouteInfo(data) {
    if (data.start) this.startPoint.textContent = data.start;
    if (data.end) this.endPoint.textContent = data.end;
    if (data.waypointCount !== undefined) {
      this.waypointCount.textContent = data.waypointCount;
      this.hasRoute = data.waypointCount > 0;
    }
    this.routeInfo.classList.remove('hidden');
    this.updatePlaybackState('stopped');
  }

  updateStatus(data) {
    if (data.inStreetView !== undefined) {
      if (!data.inStreetView) {
        this.showStatus('Enter Street View to start', 'info');
      } else {
        this.hideStatus();
      }
    }
    if (data.isPlaying !== undefined) {
      this.updatePlaybackState(data.isPlaying ? 'playing' : 'stopped');
    }
    if (data.progress !== undefined) {
      this.updateProgress(data.progress);
    }
  }

  showStatus(message, type = 'info') {
    this.statusMessage.classList.remove('hidden', 'error', 'success');
    if (type !== 'info') {
      this.statusMessage.classList.add(type);
    }
    this.statusText.textContent = message;

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => this.hideStatus(), 3000);
    }
  }

  hideStatus() {
    this.statusMessage.classList.add('hidden');
  }

  toggleSettings() {
    const section = this.settingsToggle.closest('.section-collapsible');
    section.classList.toggle('open');
    this.settingsContent.classList.toggle('hidden');
  }

  updateSettings() {
    const settings = {
      smoothTransitions: this.smoothTransitions.checked,
      transitionSpeed: parseInt(this.transitionSpeed.value),
      autoHeading: this.autoHeading.checked
    };
    this.sendMessage('updateSettings', settings);
    chrome.storage.local.set({ streetflixSettings: settings });
  }

  async loadState() {
    // Load saved settings
    const stored = await chrome.storage.local.get(['streetflixSettings']);
    if (stored.streetflixSettings) {
      const s = stored.streetflixSettings;
      this.smoothTransitions.checked = s.smoothTransitions ?? true;
      this.transitionSpeed.value = s.transitionSpeed ?? 300;
      this.transitionValue.textContent = `${this.transitionSpeed.value}ms`;
      this.autoHeading.checked = s.autoHeading ?? true;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
