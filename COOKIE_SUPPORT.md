# Cookie Support Documentation

## Overview

WebCloner now supports cookie injection and automatic cookie persistence across requests. This feature allows you to:

- Inject custom cookies into requests
- Automatically collect and persist cookies from responses
- Maintain session state across page downloads
- Bypass cookie-based authentication and protection

## Features

### Cookie Injection

- Inject cookies via CLI arguments
- Load cookies from JSON file
- Set cookies in Electron GUI
- Support for all cookie attributes (domain, path, expires, etc.)

### Automatic Cookie Persistence

- Cookies from responses are automatically stored
- Cookies are reused for subsequent requests to the same domain
- Works with both HTTP (Axios) and browser mode (Puppeteer)
- Cookies persist across the entire cloning session

### Cross-Mode Support

- Cookies work seamlessly when switching between HTTP and browser mode
- Browser-collected cookies are synced back to HTTP client
- Consistent cookie handling across all download methods

## CLI Usage

### Basic Cookie Injection

```bash
# Single cookie
webcloner-js https://example.com \
  --cookie "session=abc123"

# Multiple cookies
webcloner-js https://example.com \
  --cookie "session=abc123" \
  --cookie "user_id=456"

# Cookie with domain
webcloner-js https://example.com \
  --cookie "session=abc123;domain=example.com"

# Cookie with domain and path
webcloner-js https://example.com \
  --cookie "session=abc123;domain=example.com;path=/api"
```

### Load Cookies from File

Create a JSON file with your cookies:

```json
[
  {
    "name": "session",
    "value": "abc123def456",
    "domain": "example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  },
  {
    "name": "user_pref",
    "value": "dark_mode",
    "domain": "example.com"
  }
]
```

Then load it:

```bash
webcloner-js https://example.com \
  --cookie-file ./cookies.json \
  -o ./output
```

### Combined with Other Options

```bash
webcloner-js https://example.com \
  -o ./output \
  --cookie-file ./cookies.json \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --delay 500
```

## Electron GUI Usage

### Setting Cookies

1. Open the Electron GUI: `npm run start:electron`
2. Click "Advanced Settings"
3. Scroll to the "Cookies (JSON)" field
4. Enter your cookies in JSON format:

```json
[
  {
    "name": "session",
    "value": "your-session-token",
    "domain": "example.com"
  }
]
```

5. Start cloning as normal

### Cookie Format in GUI

The cookies field accepts a JSON array of cookie objects:

```json
[
  {
    "name": "cookie_name",
    "value": "cookie_value",
    "domain": "example.com",
    "path": "/",
    "expires": 1735689600,
    "secure": true,
    "httpOnly": true,
    "sameSite": "Lax"
  }
]
```

**Required fields:**

- `name`: Cookie name
- `value`: Cookie value

**Optional fields:**

- `domain`: Cookie domain (defaults to target URL domain)
- `path`: Cookie path (defaults to `/`)
- `expires`: Expiration timestamp (Unix time)
- `secure`: HTTPS only flag
- `httpOnly`: HTTP only flag (not accessible via JavaScript)
- `sameSite`: `"Strict"`, `"Lax"`, or `"None"`

## Programmatic Usage

```typescript
import { WebsiteCloner } from "./src/cloner.js";
import type { Cookie } from "./src/types.js";

const cookies: Cookie[] = [
  {
    name: "session",
    value: "abc123def456",
    domain: "example.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "Lax",
  },
  {
    name: "preferences",
    value: "theme=dark",
    domain: "example.com",
  },
];

const cloner = new WebsiteCloner({
  targetUrl: "https://example.com",
  outputDir: "./output",
  cookies: cookies,
  // ... other options
});

await cloner.clone();

// Get collected cookies after cloning
const collectedCookies = cloner.downloader.getCollectedCookies();
console.log("Collected cookies:", collectedCookies);
```

## Use Cases

### 1. Authenticated Content

Clone content that requires authentication:

```bash
# Export cookies from your browser (using a browser extension)
# Save to cookies.json

webcloner-js https://members.example.com \
  --cookie-file ./cookies.json \
  -o ./members-content
```

### 2. Session-Based Protection

Bypass session-based anti-bot protection:

```json
[
  {
    "name": "cf_clearance",
    "value": "your-cloudflare-clearance-token",
    "domain": ".example.com"
  },
  {
    "name": "session_id",
    "value": "your-session-id",
    "domain": "example.com"
  }
]
```

### 3. Preference Cookies

Set user preferences before cloning:

```json
[
  {
    "name": "language",
    "value": "en",
    "domain": "example.com"
  },
  {
    "name": "region",
    "value": "US",
    "domain": "example.com"
  }
]
```

### 4. A/B Testing

Clone specific A/B test variants:

```json
[
  {
    "name": "ab_test_variant",
    "value": "variant_b",
    "domain": "example.com"
  }
]
```

## How It Works

### Cookie Flow

```
1. Initial Request
   ├─> Inject user-provided cookies
   ├─> Send HTTP request with Cookie header
   └─> Store cookies from Set-Cookie response header

2. Subsequent Requests
   ├─> Load cookies for domain from cookie jar
   ├─> Merge with user-provided cookies
   ├─> Send request with all cookies
   └─> Update cookie jar with new cookies

3. Browser Mode (if protection detected)
   ├─> Initialize Puppeteer with cookies
   ├─> Execute JavaScript (cookies available to scripts)
   ├─> Collect cookies after page load
   └─> Sync cookies back to HTTP client

4. Cleanup
   └─> All collected cookies available for export
```

### Cookie Persistence

Cookies are stored in memory during the cloning session:

- **HTTP Mode**: Cookies stored in `cookieJar` Map
- **Browser Mode**: Cookies stored in Puppeteer's cookie store
- **Sync**: Cookies automatically synced between modes
- **Scope**: Cookies persist for the entire cloning session

### Domain Matching

Cookies are matched to requests based on domain:

- Exact domain match: `example.com` → `example.com`
- Subdomain match: `.example.com` → `sub.example.com`
- Parent domain match: `example.com` → `api.example.com`

## Exporting Cookies from Browser

### Chrome/Edge

1. Install "EditThisCookie" or "Cookie-Editor" extension
2. Visit the website
3. Click the extension icon
4. Export cookies as JSON
5. Save to a file

### Firefox

1. Install "Cookie Quick Manager" extension
2. Visit the website
3. Click the extension icon
4. Export cookies as JSON
5. Save to a file

### Manual Export

You can also export cookies manually from DevTools:

```javascript
// In browser console
copy(
  JSON.stringify(
    document.cookie.split(";").map((c) => {
      const [name, value] = c.trim().split("=");
      return { name, value, domain: location.hostname };
    })
  )
);
```

## Security Considerations

### Cookie Storage

- Cookies are stored in memory only
- No persistent cookie storage
- Cookies are cleared when the program exits

### Sensitive Cookies

- Be careful with session tokens and authentication cookies
- Don't commit cookie files to version control
- Use `.gitignore` for cookie files:
  ```
  cookies.json
  *.cookies.json
  ```

### HTTPS Cookies

- Secure cookies (secure=true) work with HTTPS URLs
- Insecure HTTP requests will not include secure cookies

## Troubleshooting

### Cookies Not Working

**Issue**: Cookies don't seem to be sent with requests

**Solutions**:

1. Check cookie domain matches target URL
2. Verify cookie format is correct (JSON array)
3. Check if cookies have expired
4. Ensure domain includes leading dot for subdomains (`.example.com`)

### Session Expires

**Issue**: Session expires during cloning

**Solutions**:

1. Reduce delay between requests
2. Export fresh cookies before cloning
3. Check cookie expiration time
4. Some sites have short session timeouts

### Browser Mode Cookies

**Issue**: Cookies work in HTTP mode but not browser mode

**Solutions**:

1. Cookies are automatically synced - this shouldn't happen
2. Check browser console for cookie errors
3. Verify cookie domain/path settings

## Examples

### Example 1: Clone Protected Site

```bash
# 1. Get cookies from browser
# 2. Save to cookies.json
# 3. Clone with cookies

webcloner-js https://protected-site.com \
  --cookie-file ./cookies.json \
  -o ./output \
  --delay 500
```

### Example 2: Multiple Domains

```json
[
  {
    "name": "session",
    "value": "main-session",
    "domain": "example.com"
  },
  {
    "name": "api_key",
    "value": "api-session",
    "domain": "api.example.com"
  },
  {
    "name": "cdn_token",
    "value": "cdn-token",
    "domain": "cdn.example.com"
  }
]
```

### Example 3: With Proxy

```bash
webcloner-js https://example.com \
  --cookie "session=abc123" \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user username \
  --proxy-pass password \
  -o ./output
```

## API Reference

### Cookie Interface

```typescript
interface Cookie {
  name: string; // Required: Cookie name
  value: string; // Required: Cookie value
  domain?: string; // Optional: Cookie domain
  path?: string; // Optional: Cookie path
  expires?: number; // Optional: Expiration (Unix timestamp)
  httpOnly?: boolean; // Optional: HTTP only flag
  secure?: boolean; // Optional: Secure flag
  sameSite?: "Strict" | "Lax" | "None"; // Optional: SameSite policy
}
```

### Methods

```typescript
// Get collected cookies
downloader.getCollectedCookies(): Cookie[]

// Browser downloader methods
browserDownloader.exportCookies(): Cookie[]
browserDownloader.getCollectedCookies(): Map<string, any[]>
```

## Best Practices

1. **Use Cookie Files**: Store cookies in JSON files for reusability
2. **Fresh Cookies**: Export cookies just before cloning
3. **Minimal Cookies**: Only include necessary cookies
4. **Domain Specificity**: Use specific domains when possible
5. **Security**: Never commit cookie files to git
6. **Testing**: Test with a small depth first
7. **Delays**: Use appropriate delays to avoid triggering rate limits

## Summary

Cookie support in WebCloner provides:

- ✅ Easy cookie injection via CLI or GUI
- ✅ Automatic cookie persistence
- ✅ Cross-mode cookie synchronization
- ✅ Session state maintenance
- ✅ Authentication bypass capability
- ✅ Full cookie attribute support

This feature works seamlessly with all other WebCloner features including proxies, anti-bot protection, and custom headers.
