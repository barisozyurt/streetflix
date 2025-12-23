/**
 * StreetFlix - Background Service Worker
 * Handles extension lifecycle and cross-tab communication
 */

// Extension installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[StreetFlix] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      streetflixSettings: {
        smoothTransitions: true,
        transitionSpeed: 300,
        autoHeading: true,
        defaultSpeed: 'cycling'
      }
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[StreetFlix Background] Message:', message);

  switch (message.type) {
    case 'getSettings':
      chrome.storage.local.get(['streetflixSettings'], (result) => {
        sendResponse(result.streetflixSettings || {});
      });
      return true; // Async response

    case 'saveRoute':
      // Save route for later use
      chrome.storage.local.set({
        [`route_${message.name}`]: message.route
      });
      sendResponse({ success: true });
      break;

    case 'loadRoute':
      chrome.storage.local.get([`route_${message.name}`], (result) => {
        sendResponse({ route: result[`route_${message.name}`] });
      });
      return true;

    case 'listRoutes':
      chrome.storage.local.get(null, (result) => {
        const routes = Object.keys(result)
          .filter(key => key.startsWith('route_'))
          .map(key => key.replace('route_', ''));
        sendResponse({ routes });
      });
      return true;
  }
});

// Handle extension icon click when popup is not available
chrome.action.onClicked.addListener((tab) => {
  // This only fires if there's no popup defined
  // Since we have a popup, this won't fire, but keeping for reference
  console.log('[StreetFlix] Extension clicked on tab:', tab.id);
});

// Keep track of active tabs with StreetFlix
const activeTabs = new Set();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('google.com/maps')) {
      activeTabs.add(tabId);
    } else {
      activeTabs.delete(tabId);
    }
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

// Export for potential use
self.streetflixBackground = {
  activeTabs
};
