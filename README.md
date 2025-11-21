# webcloner-js - Advanced Website Cloner

A powerful, stealthy website cloner/scraper built with TypeScript that downloads entire websites for offline use. Supports HTTP proxy authentication, comprehensive asset downloading (CSS, JS, images, SVG sprites, fonts, etc.), and intelligent URL rewriting.

**Now with a beautiful Electron GUI!** 🎨 See [ELECTRON_GUI.md](ELECTRON_GUI.md) for details.

## Features

- 🚀 **Complete Website Cloning** - Downloads HTML, CSS, JavaScript, images, fonts, and all other assets
- 🔒 **HTTP Proxy Support** - Connect through HTTP proxies with username/password authentication
- 💾 **Proxy Configuration Management** - Save, load, and manage multiple proxy configurations with password masking
- 🎯 **SVG Sprite Support** - Properly handles SVG sprites with `xlink:href` references
- 🔄 **Smart URL Rewriting** - Converts all URLs to relative local paths for offline browsing
- 🕷️ **Stealthy Crawling** - Configurable delays, random user agents, and realistic headers
- 📦 **Asset Discovery** - Extracts assets from:
  - HTML tags (img, script, link, etc.)
  - CSS files (background images, fonts, etc.)
  - Inline styles
  - SVG sprites and references
  - srcset attributes
  - Data attributes (data-src, data-lazy-src)
- 🎨 **CSS Processing** - Parses CSS files to download referenced assets
- 🌐 **External Link Handling** - Optional following of external links
- 📊 **Progress Tracking** - Real-time statistics and detailed logging
- ⚙️ **Highly Configurable** - Control depth, patterns, delays, and more

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Or use directly with ts-node
npm run dev -- <url> [options]
```

## Quick Start

### GUI Application (Recommended)

```bash
# Run the Electron GUI
npm run start:electron
```

The GUI provides an intuitive interface with all features accessible through a modern, minimalistic design.

### CLI Usage

#### Basic Usage

```bash
# Clone a website to default directory (./cloned-site)
npm run dev -- https://example.com

# Specify output directory
npm run dev -- https://example.com -o ./my-site

# Set crawl depth
npm run dev -- https://example.com -d 5
```

### With HTTP Proxy

```bash
# Using proxy with authentication
npm run dev -- https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user myusername \
  --proxy-pass mypassword

# Save proxy configuration for reuse
npm run dev -- https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user myusername \
  --proxy-pass mypassword \
  --save-proxy my-proxy

# Load saved proxy configuration
npm run dev -- https://example.com --load-proxy my-proxy
```

### Proxy Management

```bash
# List all saved proxies (passwords masked)
npm run dev -- list-proxies

# List proxies with passwords visible
npm run dev -- list-proxies --show-passwords

# Show specific proxy details
npm run dev -- show-proxy my-proxy

# Show proxy with password visible
npm run dev -- show-proxy my-proxy --show-password

# Delete a saved proxy
npm run dev -- delete-proxy my-proxy
```

📖 **See [PROXY_MANAGEMENT.md](PROXY_MANAGEMENT.md) for complete proxy management documentation.**

### Advanced Options

```bash
# Full example with all options
npm run dev -- https://example.com \
  -o ./output \
  -d 3 \
  --delay 200 \
  --follow-external \
  --user-agent "Mozilla/5.0 Custom Agent" \
  --include ".*\\.example\\.com.*" ".*\\.cdn\\.com.*" \
  --exclude ".*\\.pdf$" ".*login.*" \
  --header "Authorization: Bearer token123" \
  --header "X-Custom-Header: value" \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user username \
  --proxy-pass password
```

## CLI Options

### Main Clone Command

| Option                    | Description                           | Default         |
| ------------------------- | ------------------------------------- | --------------- |
| `<url>`                   | Target website URL to clone           | Required        |
| `-o, --output <dir>`      | Output directory                      | `./cloned-site` |
| `-d, --depth <number>`    | Maximum crawl depth                   | `3`             |
| `--delay <ms>`            | Delay between requests (milliseconds) | `100`           |
| `--proxy-host <host>`     | Proxy server host                     | -               |
| `--proxy-port <port>`     | Proxy server port                     | -               |
| `--proxy-user <username>` | Proxy authentication username         | -               |
| `--proxy-pass <password>` | Proxy authentication password         | -               |
| `--load-proxy <name>`     | Load saved proxy configuration        | -               |
| `--save-proxy <name>`     | Save proxy configuration with name    | -               |
| `--user-agent <agent>`    | Custom user agent string              | Random          |
| `--follow-external`       | Follow external links                 | `false`         |
| `--include <patterns...>` | Include URL patterns (regex)          | All             |
| `--exclude <patterns...>` | Exclude URL patterns (regex)          | None            |
| `--header <header...>`    | Custom headers (format: "Key: Value") | -               |

### Proxy Management Commands

| Command                             | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `list-proxies`                      | List all saved proxy configurations      |
| `list-proxies --show-passwords`     | List proxies with passwords visible      |
| `show-proxy <name>`                 | Show details of a specific proxy         |
| `show-proxy <name> --show-password` | Show proxy details with password visible |
| `delete-proxy <name>`               | Delete a saved proxy configuration       |

## Programmatic Usage

```typescript
import { WebsiteCloner } from "./src/cloner.js";

const cloner = new WebsiteCloner({
  targetUrl: "https://example.com",
  outputDir: "./cloned-site",
  maxDepth: 3,
  delay: 100,
  proxy: {
    host: "proxy.example.com",
    port: 8080,
    username: "user",
    password: "pass",
  },
  userAgent: "Custom User Agent",
  followExternalLinks: false,
  includePatterns: [".*\\.example\\.com.*"],
  excludePatterns: [".*\\.pdf$"],
  headers: {
    Authorization: "Bearer token",
  },
});

await cloner.clone();
```

## How It Works

1. **Initial Request** - Downloads the target URL's HTML content
2. **Asset Extraction** - Parses HTML to find all assets:
   - Stylesheets (`<link rel="stylesheet">`)
   - Scripts (`<script src>`)
   - Images (`<img>`, `srcset`, background images)
   - SVG sprites (`<use xlink:href>`)
   - Fonts (from CSS `@font-face`)
   - Videos, audio, iframes, etc.
3. **Asset Download** - Downloads each asset with proper referer headers
4. **CSS Processing** - Parses CSS files to find and download referenced assets
5. **URL Rewriting** - Converts all absolute URLs to relative local paths
6. **Link Crawling** - Follows links within the same domain (respecting depth limit)
7. **File Organization** - Saves files maintaining directory structure

## SVG Sprite Support

The cloner properly handles SVG sprites referenced with `xlink:href`:

```html
<!-- Original -->
<svg class="icon">
  <use xlink:href="./assets/sprite.svg#icon-name"></use>
</svg>

<!-- After cloning (with proper relative path) -->
<svg class="icon">
  <use xlink:href="../assets/sprite.svg#icon-name"></use>
</svg>
```

## Output Structure

```
cloned-site/
├── index.html                 # Main page
├── about.html                 # Other pages
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   ├── images/
│   │   ├── logo.png
│   │   └── sprite.svg
│   └── fonts/
│       └── font.woff2
├── external/                  # External domain assets (if enabled)
│   └── cdn_example_com/
│       └── library.js
└── url-mapping.json          # URL to local path mapping
```

## Stealth Features

- **Random User Agents** - Rotates between realistic browser user agents
- **Realistic Headers** - Includes Accept, Accept-Language, Accept-Encoding, etc.
- **Referer Headers** - Sends proper referer for each request
- **Configurable Delays** - Adds delays between requests to avoid detection
- **Proxy Support** - Routes traffic through HTTP proxies

## Error Handling

- Failed downloads are logged but don't stop the cloning process
- Statistics show successful and failed downloads
- Detailed error messages for debugging

## Performance Tips

1. **Adjust Delay** - Lower delay for faster cloning (but less stealthy)
2. **Limit Depth** - Reduce depth for large sites
3. **Use Patterns** - Include/exclude patterns to focus on specific content
4. **Proxy Selection** - Use fast, reliable proxies for better performance

## Limitations

- JavaScript-rendered content requires the page to be pre-rendered
- Dynamic content loaded via AJAX may not be captured
- Some anti-scraping measures may block requests
- Very large sites may take significant time to clone

## Security & Legal

⚠️ **Important**: Always respect website terms of service and robots.txt. This tool is for:

- Backing up your own websites
- Archiving public domain content
- Educational purposes
- Authorized testing

Do not use this tool to:

- Violate copyright laws
- Bypass paywalls or authentication
- Overload servers with requests
- Access restricted content without permission

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Troubleshooting

### "Failed to download" errors

- Check if the website blocks scrapers
- Try increasing the delay
- Use a different user agent
- Check proxy configuration

### Missing assets

- Increase crawl depth
- Check include/exclude patterns
- Some assets may be loaded dynamically via JavaScript

### Proxy connection issues

- Verify proxy credentials
- Check proxy host and port
- Ensure proxy supports HTTP/HTTPS

## Examples

### Clone a blog

```bash
npm run dev -- https://blog.example.com -d 2 -o ./blog-backup
```

### Clone with proxy

```bash
npm run dev -- https://example.com \
  --proxy-host 192.168.1.100 \
  --proxy-port 3128 \
  --proxy-user admin \
  --proxy-pass secret123
```

### Clone only specific sections

```bash
npm run dev -- https://example.com \
  --include ".*example\\.com/docs.*" \
  --exclude ".*\\.pdf$"
```

### Clone with custom headers

```bash
npm run dev -- https://api.example.com \
  --header "Authorization: Bearer YOUR_TOKEN" \
  --header "X-API-Key: YOUR_KEY"
```
