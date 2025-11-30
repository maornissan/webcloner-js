# Fetch Request Import Feature

## Overview

WebCloner now supports importing fetch requests directly from your browser's DevTools. Simply copy a fetch request and paste it into WebCloner - it will automatically extract the URL, headers, and cookies.

## Why This Feature?

When you want to clone a website that requires authentication or specific headers:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to the page you want to clone
4. Right-click on the request → Copy → Copy as fetch
5. Paste into WebCloner

No need to manually extract cookies, headers, or session tokens!

## CLI Usage

### From String

```bash
webcloner-js --fetch 'fetch("https://example.com", {
  "headers": {
    "accept": "text/html",
    "cookie": "session=abc123; user_id=456"
  }
})' -o ./output
```

### From File

Save your fetch request to a file:

```javascript
// request.txt
fetch("https://jp.globalbridgeconsultingsas.com/", {
  headers: {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    cookie:
      "PHPSESSID=96c6a187abc1f5057af8b51e4122f946; _cid=cccd6a960ee241dc859d855808f87a00",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
  },
  method: "GET",
});
```

Then use it:

```bash
webcloner-js --fetch-file ./request.txt -o ./output
```

### Override Specific Options

You can still override specific options:

```bash
# Use fetch request but override output directory and add delay
webcloner-js --fetch-file ./request.txt \
  -o ./custom-output \
  --delay 500 \
  --depth 5
```

## Electron GUI Usage

### Step-by-Step

1. **Open WebCloner GUI**

   ```bash
   npm run start:electron
   ```

2. **Get Fetch Request from Browser**
   - Open your browser (Chrome, Edge, Firefox)
   - Press F12 to open DevTools
   - Go to the **Network** tab
   - Navigate to the page you want to clone
   - Find the main document request (usually the first one)
   - Right-click → **Copy** → **Copy as fetch**

3. **Paste into WebCloner**
   - In WebCloner GUI, click "Advanced Settings"
   - Find the "Fetch Request (from DevTools)" field
   - Paste your fetch request
   - Click "Parse Fetch Request" button

4. **Verify Extraction**
   - URL field will be auto-filled
   - Headers will be populated in JSON format
   - Cookies will be extracted and formatted
   - Check the terminal for confirmation

5. **Start Cloning**
   - Adjust any other settings as needed
   - Click "Start Cloning"

### Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│ Browser DevTools                                        │
├─────────────────────────────────────────────────────────┤
│ Network Tab                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ example.com    200  document  1.2 KB  120ms         │ │
│ │ [Right-click] → Copy → Copy as fetch                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ WebCloner GUI - Advanced Settings                      │
├─────────────────────────────────────────────────────────┤
│ Fetch Request (from DevTools)                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ fetch("https://example.com", {                      │ │
│ │   "headers": {                                      │ │
│ │     "cookie": "session=abc123"                      │ │
│ │   }                                                 │ │
│ │ })                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│ [Parse Fetch Request]                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Auto-populated Fields                                   │
├─────────────────────────────────────────────────────────┤
│ URL: https://example.com                                │
│ Headers: {"accept": "text/html", ...}                   │
│ Cookies: [{"name": "session", "value": "abc123"}]      │
└─────────────────────────────────────────────────────────┘
```

## What Gets Extracted

### URL

The target URL is extracted and populated into the URL field.

### Headers

All headers except `cookie` are extracted and formatted as JSON:

```json
{
  "accept": "text/html,application/xhtml+xml",
  "accept-language": "ja,en-US;q=0.9",
  "user-agent": "Mozilla/5.0...",
  "sec-fetch-dest": "document"
}
```

### Cookies

The `cookie` header is parsed into individual cookies:

```json
[
  {
    "name": "PHPSESSID",
    "value": "96c6a187abc1f5057af8b51e4122f946"
  },
  {
    "name": "_cid",
    "value": "cccd6a960ee241dc859d855808f87a00"
  }
]
```

## Browser-Specific Instructions

### Chrome / Edge

1. Open DevTools: `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
2. Go to **Network** tab
3. Reload the page if needed
4. Click on the main document request (first item)
5. Right-click → **Copy** → **Copy as fetch (Node.js)**
6. Paste into WebCloner

### Firefox

1. Open DevTools: `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
2. Go to **Network** tab
3. Reload the page if needed
4. Click on the main document request
5. Right-click → **Copy** → **Copy as fetch**
6. Paste into WebCloner

### Safari

1. Enable Developer Menu: Preferences → Advanced → Show Develop menu
2. Open Web Inspector: `Cmd+Option+I`
3. Go to **Network** tab
4. Reload the page
5. Click on the request
6. Right-click → **Copy as fetch**
7. Paste into WebCloner

## Real-World Example

### Scenario: Clone a Protected Japanese Website

You want to clone `https://jp.globalbridgeconsultingsas.com/` which requires specific cookies and headers.

**Step 1: Get the fetch request**

```javascript
fetch("https://jp.globalbridgeconsultingsas.com/", {
  headers: {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    priority: "u=0, i",
    "sec-ch-ua": '"Chromium";v="142"',
    "sec-fetch-dest": "document",
    cookie:
      "PHPSESSID=96c6a187abc1f5057af8b51e4122f946; _cid=cccd6a960ee241dc859d855808f87a00; f=bW9uZXlfMTc2Mzk4NjI3Ml8zMTE%3D",
  },
  method: "GET",
});
```

**Step 2: CLI Usage**

```bash
# Save to file
cat > request.txt << 'EOF'
fetch("https://jp.globalbridgeconsultingsas.com/", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    "cookie": "PHPSESSID=96c6a187abc1f5057af8b51e4122f946; _cid=cccd6a960ee241dc859d855808f87a00"
  }
});
EOF

# Clone with fetch request
webcloner-js --fetch-file ./request.txt -o ./jp-site
```

**Step 3: Output**

```
✓ Parsed fetch request:
URL: https://jp.globalbridgeconsultingsas.com/
Method: GET

Headers:
  accept: text/html,application/xhtml+xml,application/xml;q=0.9
  accept-language: ja,en-US;q=0.9,en;q=0.8

Cookies:
  PHPSESSID=96c6a187abc1f5057af8b51e4122f946
  _cid=cccd6a960ee241dc859d855808f87a00

Starting clone of https://jp.globalbridgeconsultingsas.com/...
```

## Advanced Usage

### Combine with Other Options

```bash
# Fetch request + proxy + custom depth
webcloner-js --fetch-file ./request.txt \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --depth 5 \
  --delay 500 \
  -o ./output

# Fetch request + additional cookies
webcloner-js --fetch-file ./request.txt \
  --cookie "extra_cookie=value" \
  -o ./output

# Fetch request + additional headers
webcloner-js --fetch-file ./request.txt \
  --header "X-Custom-Header: value" \
  -o ./output
```

### Programmatic Usage

```typescript
import { parseFetchRequest } from "./src/fetch-parser.js";
import { WebsiteCloner } from "./src/cloner.js";

const fetchString = `fetch("https://example.com", {
  "headers": {
    "cookie": "session=abc123"
  }
})`;

const parsed = parseFetchRequest(fetchString);

const cloner = new WebsiteCloner({
  targetUrl: parsed.url,
  outputDir: "./output",
  headers: parsed.headers,
  cookies: parsed.cookies,
});

await cloner.clone();
```

## Troubleshooting

### Issue: "Could not parse URL from fetch request"

**Cause**: Invalid fetch format or missing URL

**Solution**:

- Ensure you copied the complete fetch request
- Check that the URL is in quotes
- Try copying again from DevTools

### Issue: No cookies extracted

**Cause**: Cookies might be in a different format

**Solution**:

- Check if cookies are in the `cookie` header
- Some browsers might not include cookies in "Copy as fetch"
- Manually add cookies using `--cookie` option

### Issue: Headers not working

**Cause**: Some headers might be browser-specific

**Solution**:

- Remove browser-specific headers like `sec-ch-ua`
- Focus on essential headers: `accept`, `accept-language`, `user-agent`
- Test with minimal headers first

## Tips & Best Practices

### ✅ DO:

- Copy the main document request (first in Network tab)
- Test with a small depth first (`--depth 1`)
- Verify the parsed output before cloning
- Save fetch requests to files for reuse

### ❌ DON'T:

- Copy XHR/API requests (use document requests)
- Include sensitive tokens in shared examples
- Forget to check cookie expiration
- Clone without testing the request first

## Security Notes

- Fetch requests may contain sensitive session tokens
- Don't share fetch requests publicly
- Cookies expire - get fresh requests before cloning
- Be careful with authentication cookies

## See Also

- [COOKIE_SUPPORT.md](COOKIE_SUPPORT.md) - Cookie management
- [ANTI_BOT_PROTECTION.md](ANTI_BOT_PROTECTION.md) - Anti-bot features
- [README.md](README.md) - General usage

## Summary

The fetch request import feature makes it incredibly easy to clone authenticated or protected websites:

1. **Copy** fetch request from browser DevTools
2. **Paste** into WebCloner (CLI or GUI)
3. **Clone** with all cookies and headers automatically applied

No manual cookie extraction, no header configuration - just copy and paste! 🚀
