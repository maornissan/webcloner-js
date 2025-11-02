# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Basic Usage

### Clone a website (simplest form)
```bash
npm run dev -- https://example.com
```

This will:
- Clone the website to `./cloned-site/`
- Download all HTML, CSS, JS, images, SVG sprites, fonts
- Rewrite all URLs to work offline
- Crawl up to 3 levels deep

### Clone with HTTP Proxy (with authentication)
```bash
npm run dev -- https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user myusername \
  --proxy-pass mypassword
```

### Clone with custom output directory
```bash
npm run dev -- https://example.com -o ./my-website-backup
```

## What Gets Downloaded?

The cloner automatically downloads:

- ✅ HTML pages
- ✅ CSS stylesheets (and assets referenced in CSS)
- ✅ JavaScript files
- ✅ Images (jpg, png, gif, webp, svg, ico)
- ✅ SVG sprites with `xlink:href` references
- ✅ Fonts (woff, woff2, ttf, otf)
- ✅ Background images from inline styles
- ✅ Images from `srcset` attributes
- ✅ Lazy-loaded images (`data-src`, `data-lazy-src`)
- ✅ Videos and audio files
- ✅ Favicons and app icons

## SVG Sprite Support

Your specific use case with SVG sprites is fully supported:

**Original HTML:**
```html
<svg class="sc-3dc836bf-0 jgdvWe">
  <use xlink:href="./assets_main/images/sprite.svg#bars"></use>
</svg>
```

**After cloning:**
- The `sprite.svg` file is downloaded
- The `xlink:href` path is rewritten to work with the local file structure
- The fragment identifier (`#bars`) is preserved

## Testing the Cloned Site

```bash
# Navigate to output directory
cd cloned-site

# Start a local server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `-o, --output` | Output directory | `-o ./backup` |
| `-d, --depth` | Max crawl depth | `-d 5` |
| `--delay` | Delay between requests (ms) | `--delay 200` |
| `--proxy-host` | Proxy server host | `--proxy-host 192.168.1.1` |
| `--proxy-port` | Proxy server port | `--proxy-port 8080` |
| `--proxy-user` | Proxy username | `--proxy-user admin` |
| `--proxy-pass` | Proxy password | `--proxy-pass secret` |

## Full Example with Proxy

```bash
npm run dev -- https://target-website.com \
  -o ./website-backup \
  -d 3 \
  --delay 150 \
  --proxy-host 10.0.0.50 \
  --proxy-port 3128 \
  --proxy-user admin \
  --proxy-pass ProxyPassword123
```

## Troubleshooting

### "Failed to download" errors
- The website might be blocking scrapers
- Try increasing `--delay` to 500 or more
- Check if proxy credentials are correct

### Missing assets
- Increase depth with `-d 5`
- Some assets may be loaded dynamically via JavaScript

### Proxy connection issues
- Verify proxy is accessible: `curl -x http://proxy:port https://example.com`
- Check username/password are correct
- Ensure proxy supports HTTP/HTTPS

## Next Steps

- See [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for more examples
- See [README.md](README.md) for complete documentation
- Check `url-mapping.json` in output directory for URL mappings
