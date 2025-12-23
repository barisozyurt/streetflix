/**
 * StreetFlix - DOM Helper Utilities
 * DOM manipulation and observation helpers
 */

const DOMHelpers = {
  /**
   * Wait for an element to appear in the DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<Element>}
   */
  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  /**
   * Wait for a condition to be true
   * @param {Function} condition - Function returning boolean
   * @param {number} timeout - Max wait time in ms
   * @param {number} interval - Check interval in ms
   * @returns {Promise<void>}
   */
  waitForCondition(condition, timeout = 10000, interval = 100) {
    return new Promise((resolve, reject) => {
      if (condition()) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const check = setInterval(() => {
        if (condition()) {
          clearInterval(check);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(check);
          reject(new Error('Condition not met within timeout'));
        }
      }, interval);
    });
  },

  /**
   * Create an element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Attributes to set
   * @param {string|Element|Array} content - Inner content
   * @returns {Element}
   */
  createElement(tag, attrs = {}, content = null) {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });

    if (content) {
      if (Array.isArray(content)) {
        content.forEach(c => {
          if (typeof c === 'string') {
            el.appendChild(document.createTextNode(c));
          } else {
            el.appendChild(c);
          }
        });
      } else if (typeof content === 'string') {
        el.textContent = content;
      } else {
        el.appendChild(content);
      }
    }

    return el;
  },

  /**
   * Observe DOM changes
   * @param {Element} target - Element to observe
   * @param {Function} callback - Callback function
   * @param {Object} options - MutationObserver options
   * @returns {MutationObserver}
   */
  observe(target, callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: true,
      attributes: false
    };

    const observer = new MutationObserver(callback);
    observer.observe(target, { ...defaultOptions, ...options });
    return observer;
  },

  /**
   * Get computed style value
   * @param {Element} element
   * @param {string} property
   * @returns {string}
   */
  getStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  },

  /**
   * Inject CSS into the page
   * @param {string} css - CSS string
   * @param {string} id - Optional ID for the style element
   * @returns {HTMLStyleElement}
   */
  injectCSS(css, id = null) {
    const style = document.createElement('style');
    style.textContent = css;
    if (id) style.id = id;
    document.head.appendChild(style);
    return style;
  },

  /**
   * Debounce function calls
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in ms
   * @returns {Function}
   */
  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle function calls
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Minimum time between calls in ms
   * @returns {Function}
   */
  throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Check if element is visible in viewport
   * @param {Element} element
   * @returns {boolean}
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Get canvas as data URL
   * @param {HTMLCanvasElement} canvas
   * @param {string} type - Image type (image/jpeg, image/png)
   * @param {number} quality - Quality (0-1) for jpeg
   * @returns {string}
   */
  canvasToDataURL(canvas, type = 'image/jpeg', quality = 0.8) {
    return canvas.toDataURL(type, quality);
  },

  /**
   * Load image and return promise
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }
};

// Export for use in other scripts
window.DOMHelpers = DOMHelpers;
