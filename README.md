# 🎬 StreetFlix

**Transform Google Street View into an automated virtual road trip experience.**

StreetFlix is a Chrome extension that lets you sit back and watch Street View animate through any route — like a movie. Set your start and end points, choose your speed, and enjoy the ride.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Chrome](https://img.shields.io/badge/platform-Chrome-green.svg)
![Status](https://img.shields.io/badge/status-in%20development-orange.svg)

---

## ✨ Features

- 🚗 **Automated Street View playback** — No clicking, just watching
- 🎬 **Smooth cinematic transitions** — Movie-like experience, not a slideshow
- ⚡ **Multiple speed modes** — Walking, cycling, driving, or flying
- 🗺️ **Custom routes** — Set any start and end point
- ⏯️ **Full playback controls** — Play, pause, stop, skip
- 🎯 **Pre-caching** — Buffer-free viewing experience
- 🖥️ **Cinema mode** — Fullscreen immersive viewing
- ⌨️ **Keyboard shortcuts** — Space to pause, arrows to navigate

---

## 🎥 Demo

<!-- Add GIF or video demo here -->
*Coming soon...*

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/barisozyurt/streetflix.git
   cd streetflix
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `streetflix` folder

3. **Start using**
   - Navigate to [Google Maps](https://www.google.com/maps)
   - Enter Street View on any location
   - Click the StreetFlix extension icon
   - Set your route and hit Play!

---

## 🎮 Usage

### Quick Start

1. Open Google Maps and enter Street View
2. Click the StreetFlix icon in your browser toolbar
3. Click **"Set Start Point"** (uses current location)
4. Navigate to your destination in Street View
5. Click **"Set End Point"**
6. Choose your speed (🚶 Walk / 🚴 Bike / 🚗 Drive / ✈️ Fly)
7. Hit **▶️ Play** and enjoy the ride!

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Skip forward |
| `←` | Skip backward |
| `↑` | Speed up |
| `↓` | Slow down |
| `F` | Toggle fullscreen |
| `Esc` | Exit cinema mode |

### Speed Modes

| Mode | Feel | Best For |
|------|------|----------|
| 🚶 Walking | ~5 km/h | Exploring neighborhoods |
| 🚴 Cycling | ~15 km/h | City tours |
| 🚗 Driving | ~50 km/h | Road trips |
| ✈️ Flying | Fast preview | Quick route overview |

---

## 🏗️ Project Structure

```
streetflix/
├── manifest.json              # Chrome extension manifest (V3)
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Popup styles
│   └── popup.js               # Popup logic
├── content/
│   ├── content.js             # Main content script
│   ├── streetview-controller.js   # Street View API wrapper
│   ├── route-manager.js       # Route & waypoint handling
│   ├── transition-engine.js   # Smooth transitions
│   └── cache-manager.js       # Panorama pre-loading
├── background/
│   └── background.js          # Service worker
├── utils/
│   ├── geometry.js            # Geo calculations
│   └── dom-helpers.js         # DOM utilities
├── styles/
│   └── overlay.css            # Injected overlay styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠️ Development

### Prerequisites

- Google Chrome (or Chromium-based browser)
- Basic knowledge of Chrome extensions
- Node.js (optional, for build tools)

### Local Development

```bash
# Clone the repo
git clone https://github.com/barisozyurt/streetflix.git
cd streetflix

# Make changes to the source files

# Reload extension in Chrome
# Go to chrome://extensions/ and click the refresh icon
```

### Debug Tips

Open DevTools on a Google Maps page and run:
```javascript
// Check if content script loaded
console.log(window.StreetFlix);

// Explore Google Maps objects
Object.keys(window).filter(k => k.includes('google'));
```

---

## 🗺️ Roadmap

- [x] Project specification
- [ ] Basic extension structure
- [ ] Street View detection & control
- [ ] Route management
- [ ] Playback controls
- [ ] Smooth transitions
- [ ] Pre-caching system
- [ ] Cinema mode
- [ ] Route import/export
- [ ] Ambient sound integration
- [ ] Video export

---

## ⚠️ Disclaimer

This extension is for **personal and educational use only**.

StreetFlix automates interactions with Google Maps Street View, which may not comply with Google's Terms of Service for commercial or large-scale use. Use responsibly.

**This extension:**
- Does NOT use any paid Google APIs
- Does NOT store or transmit your location data
- Does NOT modify any Google Maps data
- Works entirely client-side in your browser

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 StreetFlix Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💡 Inspiration

StreetFlix was inspired by:
- [Drive & Listen](https://driveandlisten.herokuapp.com/) — Drive through cities with local radio
- The joy of virtual road trips
- The desire to explore the world from your desk

---

## 📬 Contact

Have questions or suggestions? Open an issue or reach out!

---

<p align="center">
  Made with ❤️ for virtual explorers everywhere
</p>

<p align="center">
  <a href="#-streetflix">Back to top ↑</a>
</p>
