# Anti-Bot Protection Handling

## Overview

WebCloner now automatically detects and bypasses common anti-bot protection mechanisms that use JavaScript challenges to verify browser authenticity.

## How It Works

### Detection

The tool automatically detects protection pages by looking for common patterns:

- `data-digest=` attributes
- `root-app` containers
- `app-trigger` elements
- `decodeUTF8Base64` functions
- Browser fingerprinting code
- Cloudflare challenges
- "Just a moment" or "Checking your browser" messages

### Automatic Fallback

When protection is detected:

1. **Initial Request**: Uses fast HTTP client (axios) for the first attempt
2. **Detection**: Analyzes the response for protection patterns
3. **Browser Mode**: Automatically switches to Puppeteer (headless Chrome) if protection is detected
4. **JavaScript Execution**: Waits for the protection challenge to complete
5. **Content Retrieval**: Returns the actual page content after challenge completion

## Features

### Browser-Based Downloading

- Full JavaScript execution support
- Automatic cookie handling
- Browser fingerprinting compatibility
- Network idle detection
- Configurable timeouts

### Stealth Features

- Random user agent selection
- Proper browser headers
- Referer handling
- Proxy support (including authentication)
- Network request mimicry

## Usage

No changes needed! The protection handling is completely automatic:

```bash
# CLI usage - works the same
webcloner-js https://protected-site.com -o ./output

# With proxy
webcloner-js https://protected-site.com -o ./output --proxy-host proxy.example.com --proxy-port 8080
```

## Technical Details

### Protection Types Handled

1. **JavaScript Challenges**
   - Browser fingerprinting
   - Canvas fingerprinting
   - WebGL detection
   - Timezone checks
   - Touch event detection

2. **Cookie-Based Validation**
   - Automatic cookie persistence
   - Session management
   - Flag-based validation

3. **Dynamic Content Loading**
   - AJAX-based content delivery
   - Base64-encoded responses
   - DOM manipulation after load

### Performance

- **Fast Path**: Regular HTTP requests complete in milliseconds
- **Browser Mode**: Adds 2-5 seconds per page for JavaScript execution
- **Automatic Cleanup**: Browser instances are properly closed after cloning

## Troubleshooting

### If protection bypass fails:

1. **Increase timeout**: Some challenges take longer
2. **Check proxy settings**: Ensure proxy supports HTTPS
3. **Try without proxy**: Some proxies may interfere with challenges
4. **Check console output**: Look for "Anti-bot protection detected" messages

### Common Issues

**Issue**: "Browser not initialized"

- **Solution**: Ensure Puppeteer is installed: `npm install`

**Issue**: "Timeout waiting for protection challenge"

- **Solution**: The site may have advanced protection. Try increasing delays.

**Issue**: "Failed to launch browser"

- **Solution**: Install Chrome/Chromium dependencies on your system

## Example Protected Page

The protection mechanism you encountered works like this:

```html
<!-- Initial response -->
<script>
  // Collects browser fingerprint
  var data = {
    screen: {...},
    navigator: {...},
    webgl: {...}
  };

  // Posts back to server
  xhr.send(JSON.stringify(data));

  // Server validates and returns actual content
</script>
```

WebCloner now handles this automatically by:

1. Executing the JavaScript
2. Waiting for the XHR request to complete
3. Extracting the final page content
4. Continuing with normal cloning process

## Dependencies

- **puppeteer**: Headless Chrome automation
- **axios**: Fast HTTP client for non-protected pages
- **cheerio**: HTML parsing

## Performance Tips

1. Use `--delay` to avoid triggering rate limits
2. Start with small `--depth` values for testing
3. Use proxy rotation for large-scale cloning
4. Monitor console output for protection detection

## Future Enhancements

Planned improvements:

- [ ] CAPTCHA solving integration
- [ ] Advanced fingerprint randomization
- [ ] Cloudflare Turnstile support
- [ ] reCAPTCHA v3 handling
- [ ] Persistent browser sessions for multi-page clones
