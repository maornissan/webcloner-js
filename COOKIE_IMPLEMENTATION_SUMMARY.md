# Cookie Support Implementation Summary

## Overview

Added comprehensive cookie support to WebCloner, enabling cookie injection and automatic cookie persistence across all download modes (HTTP and Browser).

## What Was Implemented

### 1. Core Cookie Infrastructure

#### Type Definitions (`src/types.ts`)

- Added `Cookie` interface with all standard cookie attributes
- Added `cookies` field to `ClonerConfig`

```typescript
interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
```

### 2. Browser Downloader (`src/browser-downloader.ts`)

**Features Added:**

- Cookie injection into Puppeteer pages
- Automatic cookie collection after page load
- Cookie persistence across browser sessions
- Cookie export functionality

**Key Methods:**

- `convertToPuppeteerCookies()` - Converts our cookie format to Puppeteer format
- `collectCookies()` - Collects cookies from pages
- `exportCookies()` - Exports collected cookies
- `getCollectedCookies()` - Gets all collected cookies

**How It Works:**

1. Injects user-provided cookies before navigation
2. Reuses previously collected cookies for same domain
3. Collects new cookies after page load
4. Merges and deduplicates cookies by name

### 3. HTTP Downloader (`src/downloader.ts`)

**Features Added:**

- Cookie jar for storing cookies
- Automatic Cookie header generation
- Set-Cookie header parsing
- Cookie synchronization with browser mode

**Key Methods:**

- `getCookieHeader()` - Generates Cookie header for requests
- `storeCookiesFromResponse()` - Parses Set-Cookie headers
- `getCollectedCookies()` - Exports all collected cookies

**Cookie Flow:**

```
Request → Add Cookie header → Send → Parse Set-Cookie → Store in jar
```

### 4. CLI Support (`src/cli.ts`)

**New Options:**

- `--cookie <cookies...>` - Inline cookie specification
- `--cookie-file <path>` - Load cookies from JSON file

**Cookie Parsing:**

- Supports `name=value` format
- Supports `name=value;domain=example.com;path=/` format
- Loads JSON array from file

**Example:**

```bash
webcloner-js https://example.com \
  --cookie "session=abc123;domain=example.com" \
  --cookie-file ./cookies.json
```

### 5. Electron GUI (`electron/`)

**UI Changes (`electron/index.html`):**

- Added "Cookies (JSON)" textarea in Advanced Settings
- Placeholder with example JSON format
- Helper text explaining the feature

**Backend Changes (`electron/main.ts`):**

- Parse cookies from JSON string
- Pass cookies to WebsiteCloner

**Frontend Changes (`electron/renderer.ts`):**

- Read cookies from textarea
- Include in options sent to main process

**Example JSON:**

```json
[
  {
    "name": "session",
    "value": "abc123",
    "domain": "example.com"
  }
]
```

### 6. Integration (`src/cloner.ts`)

- Pass cookies to Downloader constructor
- Cookies automatically used for all requests
- Works seamlessly with existing features

## How It Works

### Cookie Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Provides Cookies                               │
│    - CLI arguments                                      │
│    - JSON file                                          │
│    - Electron GUI                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Initialize Downloader                                │
│    - Store cookies in cookie jar                        │
│    - Build initial cookie map                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. HTTP Request (Axios)                                 │
│    - Generate Cookie header from jar                    │
│    - Match cookies by domain                            │
│    - Send request with cookies                          │
│    - Parse Set-Cookie from response                     │
│    - Update cookie jar                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Browser Mode (if needed)                             │
│    - Initialize Puppeteer with cookies                  │
│    - Set cookies before navigation                      │
│    - JavaScript has access to cookies                   │
│    - Collect cookies after page load                    │
│    - Sync back to HTTP cookie jar                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Subsequent Requests                                  │
│    - Reuse cookies from jar                             │
│    - Cookies persist across entire session              │
│    - Domain-based cookie matching                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Cleanup                                              │
│    - Export final cookie state                          │
│    - Cookies available for inspection                   │
│    - Memory cleared on exit                             │
└─────────────────────────────────────────────────────────┘
```

### Domain Matching

Cookies are matched to requests based on domain hierarchy:

```typescript
// Cookie domain: "example.com"
// Matches:
- example.com ✓
- www.example.com ✓
- api.example.com ✓
- sub.example.com ✓

// Cookie domain: ".example.com"
// Matches:
- example.com ✓
- www.example.com ✓
- api.example.com ✓

// Cookie domain: "api.example.com"
// Matches:
- api.example.com ✓
- sub.api.example.com ✓
// Does NOT match:
- example.com ✗
- www.example.com ✗
```

### Cross-Mode Synchronization

Cookies are automatically synchronized between HTTP and browser modes:

```
HTTP Mode                    Browser Mode
    │                            │
    ├─> Collect cookies          │
    │   from Set-Cookie          │
    │                            │
    │   Switch to browser ────>  │
    │                            │
    │                        Set cookies
    │                        in Puppeteer
    │                            │
    │                        Collect new
    │                        cookies
    │                            │
    │   <──── Sync cookies back  │
    │                            │
    ├─> Use merged cookies       │
    │   for next request         │
```

## Files Modified

### Core Files

1. **`src/types.ts`** - Added Cookie interface
2. **`src/browser-downloader.ts`** - Cookie injection and collection
3. **`src/downloader.ts`** - Cookie jar and HTTP cookie handling
4. **`src/cloner.ts`** - Pass cookies to downloader
5. **`src/cli.ts`** - CLI cookie options

### Electron Files

6. **`electron/index.html`** - Cookie input UI
7. **`electron/renderer.ts`** - Read cookie input
8. **`electron/main.ts`** - Parse and pass cookies

### Documentation

9. **`COOKIE_SUPPORT.md`** - Comprehensive cookie documentation
10. **`README.md`** - Added cookie examples

## Use Cases

### 1. Authenticated Content

Clone members-only or logged-in content by providing session cookies.

### 2. Anti-Bot Protection

Bypass cookie-based bot detection by injecting valid session cookies.

### 3. Session Persistence

Maintain session state across multi-page clones.

### 4. A/B Testing

Clone specific variants by setting A/B test cookies.

### 5. Preferences

Set language, region, or theme cookies before cloning.

## Testing

### Manual Testing

```bash
# 1. Test CLI with inline cookies
npm run dev -- https://httpbin.org/cookies \
  --cookie "test=value" \
  -o ./test1

# 2. Test CLI with cookie file
echo '[{"name":"test","value":"value"}]' > cookies.json
npm run dev -- https://httpbin.org/cookies \
  --cookie-file ./cookies.json \
  -o ./test2

# 3. Test Electron GUI
npm run start:electron
# Enter cookies in GUI: [{"name":"test","value":"value"}]
# Clone https://httpbin.org/cookies
```

### Verification

Check that cookies are sent:

1. Look for Cookie header in requests
2. Verify Set-Cookie headers are parsed
3. Check that cookies persist across requests
4. Confirm browser mode receives cookies

## Benefits

### For Users

- ✅ Easy cookie injection via CLI or GUI
- ✅ No manual header manipulation needed
- ✅ Automatic session management
- ✅ Works with anti-bot protection
- ✅ Supports all cookie attributes

### For Developers

- ✅ Clean API with Cookie interface
- ✅ Automatic cookie synchronization
- ✅ Works with existing proxy/header features
- ✅ No breaking changes to existing code
- ✅ Comprehensive documentation

## Performance Impact

- **Minimal**: Cookie handling adds negligible overhead
- **Memory**: Cookies stored in Map (efficient)
- **Network**: No extra requests, just additional headers
- **Browser Mode**: No performance impact

## Security Considerations

### Implemented

- ✅ Cookies stored in memory only
- ✅ No persistent cookie storage
- ✅ Cookies cleared on exit
- ✅ Secure cookie handling (HTTPS)

### User Responsibility

- ⚠️ Don't commit cookie files to git
- ⚠️ Use fresh cookies for sensitive sites
- ⚠️ Be aware of cookie expiration
- ⚠️ Protect session tokens

## Future Enhancements

Potential improvements:

- [ ] Cookie file encryption
- [ ] Persistent cookie storage option
- [ ] Cookie editor in GUI
- [ ] Import cookies from browser directly
- [ ] Cookie expiration warnings
- [ ] Cookie domain validation

## Backward Compatibility

✅ **Fully backward compatible**

- Cookies are optional
- Existing code works without changes
- No breaking API changes
- Default behavior unchanged

## Summary

Cookie support adds a powerful feature to WebCloner:

- **Complete**: Supports all cookie attributes
- **Automatic**: Cookies persist automatically
- **Universal**: Works in CLI, GUI, and programmatically
- **Integrated**: Seamless with anti-bot protection and proxies
- **Documented**: Comprehensive documentation provided

This feature significantly enhances WebCloner's ability to clone authenticated and protected content while maintaining ease of use.
