# Cookie Support - Quick Reference

## CLI Usage

### Inline Cookies

```bash
# Single cookie
webcloner-js https://example.com --cookie "name=value"

# Multiple cookies
webcloner-js https://example.com \
  --cookie "session=abc123" \
  --cookie "user_id=456"

# With domain
webcloner-js https://example.com \
  --cookie "session=abc123;domain=example.com;path=/"
```

### Cookie File

```bash
# Create cookies.json
cat > cookies.json << 'EOF'
[
  {
    "name": "session",
    "value": "your-session-token",
    "domain": "example.com"
  }
]
EOF

# Use it
webcloner-js https://example.com --cookie-file ./cookies.json -o ./output
```

## Electron GUI

1. Open Advanced Settings
2. Find "Cookies (JSON)" field
3. Enter JSON array:

```json
[{ "name": "session", "value": "abc123", "domain": "example.com" }]
```

4. Start cloning

## Programmatic

```typescript
import { WebsiteCloner } from "./src/cloner.js";

const cloner = new WebsiteCloner({
  targetUrl: "https://example.com",
  outputDir: "./output",
  cookies: [{ name: "session", value: "abc123", domain: "example.com" }],
});

await cloner.clone();
```

## Cookie Format

### Minimal

```json
{ "name": "cookie_name", "value": "cookie_value" }
```

### Full

```json
{
  "name": "session",
  "value": "abc123def456",
  "domain": "example.com",
  "path": "/",
  "expires": 1735689600,
  "secure": true,
  "httpOnly": true,
  "sameSite": "Lax"
}
```

## Export from Browser

### Chrome/Edge

1. Install "Cookie-Editor" extension
2. Visit website
3. Click extension → Export → JSON
4. Save to file

### Firefox

1. Install "Cookie Quick Manager"
2. Visit website
3. Export as JSON
4. Save to file

### Console

```javascript
copy(
  JSON.stringify(
    document.cookie.split(";").map((c) => {
      const [name, value] = c.trim().split("=");
      return { name, value, domain: location.hostname };
    })
  )
);
```

## Common Use Cases

### Authenticated Content

```bash
webcloner-js https://members.site.com \
  --cookie-file ./session-cookies.json \
  -o ./members
```

### With Proxy

```bash
webcloner-js https://example.com \
  --cookie "session=abc123" \
  --proxy-host proxy.example.com \
  --proxy-port 8080
```

### Multiple Domains

```json
[
  { "name": "main_session", "value": "token1", "domain": "example.com" },
  { "name": "api_key", "value": "token2", "domain": "api.example.com" }
]
```

## Troubleshooting

| Issue            | Solution                        |
| ---------------- | ------------------------------- |
| Cookies not sent | Check domain matches URL        |
| Session expires  | Use fresh cookies, reduce delay |
| JSON parse error | Validate JSON format            |
| Domain mismatch  | Add leading dot: `.example.com` |

## Tips

✅ **DO:**

- Export fresh cookies before cloning
- Use cookie files for reusability
- Include only necessary cookies
- Add to `.gitignore`

❌ **DON'T:**

- Commit cookie files to git
- Use expired cookies
- Include sensitive tokens in examples
- Share session cookies

## See Also

- [COOKIE_SUPPORT.md](COOKIE_SUPPORT.md) - Full documentation
- [ANTI_BOT_PROTECTION.md](ANTI_BOT_PROTECTION.md) - Anti-bot features
- [README.md](README.md) - General usage
