# StreetFlix Icons

## Quick Setup

For development, you can use placeholder icons. For production, create proper icons.

### Option 1: Use Placeholder (Quick)

Run this in the `icons/` directory to create simple placeholder PNGs:

```bash
# Using ImageMagick
convert -size 16x16 xc:#e50914 icon16.png
convert -size 48x48 xc:#e50914 icon48.png
convert -size 128x128 xc:#e50914 icon128.png
```

### Option 2: Create from SVG (Recommended)

1. Save the SVG below as `icon.svg`
2. Convert to PNGs using:

```bash
# Using Inkscape
inkscape -w 16 -h 16 icon.svg -o icon16.png
inkscape -w 48 -h 48 icon.svg -o icon48.png
inkscape -w 128 -h 128 icon.svg -o icon128.png

# Or using rsvg-convert
rsvg-convert -w 16 -h 16 icon.svg > icon16.png
rsvg-convert -w 48 -h 48 icon.svg > icon48.png
rsvg-convert -w 128 -h 128 icon.svg > icon128.png
```

### Option 3: Online Tools

1. Go to https://www.favicon-generator.org/ or similar
2. Upload the SVG or design an icon
3. Download in multiple sizes

## SVG Source

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e50914"/>
      <stop offset="100%" style="stop-color:#b8070f"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <!-- Play triangle -->
  <path d="M48 32 L48 96 L96 64 Z" fill="white"/>
  <!-- Road lines -->
  <rect x="52" y="58" width="8" height="12" fill="#e50914" rx="1"/>
  <rect x="68" y="58" width="8" height="12" fill="#e50914" rx="1"/>
</svg>
```

## Design Notes

- Primary color: #e50914 (Netflix red)
- Background: Gradient from #e50914 to #b8070f
- Icon: White play button with road/film strip element
- Rounded corners for modern look
