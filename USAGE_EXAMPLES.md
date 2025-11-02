# Usage Examples

## Basic Examples

### Clone a simple website
```bash
npm run dev -- https://example.com
```

### Clone with custom output directory
```bash
npm run dev -- https://example.com -o ./my-backup
```

### Clone with depth control
```bash
npm run dev -- https://example.com -d 5
```

## Proxy Examples

### HTTP Proxy without authentication
```bash
npm run dev -- https://example.com \
  --proxy-host 192.168.1.100 \
  --proxy-port 8080
```

### HTTP Proxy with username and password
```bash
npm run dev -- https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 3128 \
  --proxy-user myusername \
  --proxy-pass mypassword
```

### Clone through corporate proxy
```bash
npm run dev -- https://target-site.com \
  --proxy-host corporate-proxy.company.com \
  --proxy-port 8080 \
  --proxy-user employee123 \
  --proxy-pass SecurePass123
```

## Advanced Examples

### Clone with custom user agent
```bash
npm run dev -- https://example.com \
  --user-agent "Mozilla/5.0 (Custom Bot 1.0)"
```

### Clone with custom headers (API with authentication)
```bash
npm run dev -- https://api.example.com \
  --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --header "X-API-Key: your-api-key-here"
```

### Clone only specific URL patterns
```bash
npm run dev -- https://example.com \
  --include ".*example\\.com/docs.*" \
  --include ".*example\\.com/blog.*"
```

### Exclude specific file types or paths
```bash
npm run dev -- https://example.com \
  --exclude ".*\\.pdf$" \
  --exclude ".*\\.zip$" \
  --exclude ".*login.*" \
  --exclude ".*admin.*"
```

### Clone with increased delay (more stealthy)
```bash
npm run dev -- https://example.com \
  --delay 500
```

### Clone external links too
```bash
npm run dev -- https://example.com \
  --follow-external
```

## Real-World Scenarios

### Clone a documentation site
```bash
npm run dev -- https://docs.example.com \
  -o ./docs-backup \
  -d 4 \
  --include ".*docs\\.example\\.com.*" \
  --delay 150
```

### Clone through authenticated proxy with custom settings
```bash
npm run dev -- https://target-website.com \
  -o ./cloned-site \
  -d 3 \
  --delay 200 \
  --proxy-host 10.0.0.50 \
  --proxy-port 3128 \
  --proxy-user admin \
  --proxy-pass ProxyPass123 \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  --exclude ".*\\.pdf$"
```

### Clone a blog with all assets
```bash
npm run dev -- https://blog.example.com \
  -o ./blog-archive \
  -d 2 \
  --delay 100 \
  --include ".*blog\\.example\\.com.*"
```

### Clone with SVG sprites (like your example)
```bash
# This will properly download and rewrite SVG sprite references
npm run dev -- https://site-with-svg-sprites.com \
  -o ./site-backup \
  -d 3
```

The cloner will automatically:
- Download `./assets_main/images/sprite.svg`
- Rewrite `<use xlink:href="./assets_main/images/sprite.svg#bars">` to use relative paths
- Maintain the fragment identifier (#bars) for proper SVG sprite functionality

## Programmatic Usage

### TypeScript/JavaScript Example
```typescript
import { WebsiteCloner } from './dist/index.js';

const cloner = new WebsiteCloner({
  targetUrl: 'https://example.com',
  outputDir: './cloned-site',
  maxDepth: 3,
  delay: 100,
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    username: 'user',
    password: 'pass',
  },
  userAgent: 'Custom User Agent',
  followExternalLinks: false,
  includePatterns: ['.*\\.example\\.com.*'],
  excludePatterns: ['.*\\.pdf$', '.*login.*'],
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value',
  },
});

await cloner.clone();
console.log('Clone completed!');
```

## Testing the Cloned Site

After cloning, you can test the site locally:

```bash
# Navigate to the output directory
cd cloned-site

# Start a simple HTTP server
python3 -m http.server 8000
# or
npx http-server -p 8000

# Open in browser
# http://localhost:8000
```

## Tips

1. **Start with low depth**: Test with `-d 1` first to see what gets downloaded
2. **Use patterns wisely**: Include/exclude patterns help focus on what you need
3. **Monitor progress**: Watch the console output to see what's being downloaded
4. **Check url-mapping.json**: This file shows all URL mappings for debugging
5. **Adjust delay**: Lower delay = faster but less stealthy, higher delay = slower but safer
6. **Proxy testing**: Test proxy connection with a simple site first before complex ones
