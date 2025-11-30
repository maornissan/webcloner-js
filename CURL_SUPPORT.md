# Curl Command Support

WebCloner now supports importing `curl` commands directly from your browser's DevTools, in addition to `fetch` requests!

## Quick Start

### From Browser DevTools

1. Open DevTools (F12)
2. Go to **Network** tab
3. Find your request
4. Right-click → **Copy** → **Copy as cURL** (or **Copy as cURL (bash)**)
5. Use with WebCloner

### CLI Usage

```bash
# Save curl command to file
cat > request.txt << 'EOF'
curl 'https://example.com' \
  -H 'cookie: session=abc123; user_id=456' \
  -H 'user-agent: Mozilla/5.0...'
EOF

# Clone with curl command
webcloner-js --fetch-file ./request.txt -o ./output
```

Or inline:

```bash
webcloner-js --fetch "curl 'https://example.com' -H 'cookie: session=abc'" -o ./output
```

### Electron GUI Usage

1. Open WebCloner GUI
2. Click "Advanced Settings"
3. Paste your curl command into "Fetch Request or Curl Command" field
4. Click "Parse Request"
5. All fields auto-populate
6. Click "Start Cloning"

## What Gets Extracted

### From Your Curl Command

```bash
curl 'https://jp.globalbridgeconsultingsas.com/' \
  -H 'accept: text/html,application/xhtml+xml' \
  -H 'accept-language: ja,en-US;q=0.9' \
  -b 'PHPSESSID=96c6a187abc1f5057af8b51e4122f946; _cid=cccd6a960ee241dc859d855808f87a00' \
  -H 'user-agent: Mozilla/5.0...' \
  --data-raw 'key=value'
```

**Extracted:**

- ✅ URL: `https://jp.globalbridgeconsultingsas.com/`
- ✅ Headers: `accept`, `accept-language`, `user-agent`, etc.
- ✅ Cookies: `PHPSESSID`, `_cid` (from `-b` flag)
- ✅ Method: `POST` (auto-detected from `--data-raw`)
- ✅ POST Data: `key=value`

### Supported Curl Flags

| Flag                     | Description    | Supported                          |
| ------------------------ | -------------- | ---------------------------------- |
| `-H` or `--header`       | Custom headers | ✅ Yes                             |
| `-b` or `--cookie`       | Cookies        | ✅ Yes                             |
| `-X` or `--request`      | HTTP method    | ✅ Yes                             |
| `--data` or `--data-raw` | POST data      | ✅ Yes                             |
| `-A` or `--user-agent`   | User agent     | ⚠️ Use `-H` instead                |
| `--compressed`           | Compression    | ⚠️ Ignored (handled automatically) |

## Real Example: Your Curl Command

Your curl command:

```bash
curl 'https://jp.globalbridgeconsultingsas.com/' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9' \
  -H 'accept-language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -b 'PHPSESSID=96c6a187abc1f5057af8b51e4122f946; f=bW9uZXlfMTc2Mzk4NjI2MV8zMTE=; _cid=cccd6a960ee241dc859d855808f87a00' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' \
  --data-raw 'data=%7B%22mode%22%3A%22php%22...'
```

**Usage:**

```bash
# Save to file
cat > jp-request.txt << 'EOF'
[paste your curl command here]
EOF

# Clone the site
webcloner-js --fetch-file ./jp-request.txt -o ./jp-site --depth 3
```

**What happens:**

1. ✅ Parses URL: `https://jp.globalbridgeconsultingsas.com/`
2. ✅ Extracts 3 cookies: `PHPSESSID`, `f`, `_cid`
3. ✅ Extracts 15+ headers
4. ✅ Detects POST method
5. ✅ Includes POST data
6. ✅ Starts cloning with all context

## Auto-Detection

WebCloner automatically detects whether you're pasting:

- **Curl command** (starts with `curl`)
- **Fetch request** (starts with `fetch(`)

No need to specify which format you're using!

## Cookie Extraction

### From `-b` Flag

```bash
curl 'https://example.com' \
  -b 'session=abc123; user_id=456'
```

Extracts:

- `session=abc123`
- `user_id=456`

### From `-H` Cookie Header

```bash
curl 'https://example.com' \
  -H 'cookie: session=abc123; user_id=456'
```

Also extracts:

- `session=abc123`
- `user_id=456`

Both methods work!

## POST Requests

### Detected Automatically

```bash
curl 'https://example.com' \
  --data-raw 'username=test&password=secret'
```

- Method: `POST` (auto-detected)
- Body: `username=test&password=secret`

### Explicit Method

```bash
curl 'https://example.com' \
  -X POST \
  --data 'key=value'
```

- Method: `POST` (explicit)
- Body: `key=value`

## Tips & Tricks

### ✅ DO:

- Copy the complete curl command (all lines)
- Include all `-H` headers for best results
- Use `-b` for cookies or include in `-H 'cookie: ...'`
- Save complex commands to files for reuse

### ❌ DON'T:

- Remove the backslashes (`\`) from multi-line commands
- Edit the curl command manually (paste as-is)
- Worry about line breaks (parser handles them)

## Troubleshooting

### Issue: "Could not parse URL from curl command"

**Cause:** URL not in quotes or curl command incomplete

**Solution:**

```bash
# ✅ Good
curl 'https://example.com' -H 'header: value'

# ❌ Bad
curl https://example.com -H 'header: value'
```

### Issue: Cookies not extracted

**Cause:** Cookie format might be incorrect

**Solution:** Check that cookies are in one of these formats:

```bash
# Format 1: -b flag
-b 'cookie1=value1; cookie2=value2'

# Format 2: -H header
-H 'cookie: cookie1=value1; cookie2=value2'
```

### Issue: POST data not working

**Cause:** POST data might need URL encoding

**Solution:** Your browser already encodes it correctly when you copy as curl. Just paste as-is!

## Comparison: Fetch vs Curl

| Feature   | Fetch Request       | Curl Command             |
| --------- | ------------------- | ------------------------ |
| Source    | Copy as fetch       | Copy as cURL             |
| Format    | JavaScript          | Shell command            |
| Headers   | In `headers` object | Multiple `-H` flags      |
| Cookies   | In `cookie` header  | `-b` flag or `-H`        |
| Method    | In `method` field   | `-X` flag or auto-detect |
| POST Data | In `body`           | `--data` or `--data-raw` |

**Both work perfectly with WebCloner!**

## Advanced Usage

### Combine with Other Options

```bash
# Curl + proxy + custom depth
webcloner-js --fetch-file ./request.txt \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --depth 5 \
  -o ./output

# Curl + additional cookies
webcloner-js --fetch-file ./request.txt \
  --cookie "extra=value" \
  -o ./output
```

### Multiple Requests

Clone different pages with different contexts:

```bash
# Page 1 with auth
webcloner-js --fetch-file ./auth-request.txt -o ./page1

# Page 2 with different session
webcloner-js --fetch-file ./session2-request.txt -o ./page2
```

## Security Notes

⚠️ **Important:**

- Curl commands contain sensitive cookies and tokens
- Don't share curl commands publicly
- Don't commit curl commands to git
- Cookies expire - get fresh commands before cloning

## See Also

- [FETCH_REQUEST_IMPORT.md](FETCH_REQUEST_IMPORT.md) - Fetch request support
- [COOKIE_SUPPORT.md](COOKIE_SUPPORT.md) - Cookie management
- [README.md](README.md) - General usage

## Summary

**Curl support makes it incredibly easy to clone authenticated websites:**

1. **Copy** curl command from browser DevTools
2. **Paste** into WebCloner (CLI or GUI)
3. **Clone** with all cookies, headers, and POST data automatically applied

No manual extraction, no configuration - just copy and paste! 🚀

---

**Your specific curl command is ready to use:**

```bash
# Save your curl to file
cat > jp-request.txt << 'EOF'
curl 'https://jp.globalbridgeconsultingsas.com/' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9' \
  -H 'accept-language: ja,en-US;q=0.9,en;q=0.8' \
  -b 'PHPSESSID=96c6a187abc1f5057af8b51e4122f946; f=bW9uZXlfMTc2Mzk4NjI2MV8zMTE=; _cid=cccd6a960ee241dc859d855808f87a00' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' \
  --data-raw 'data=%7B%22mode%22%3A%22php%22...'
EOF

# Clone it!
webcloner-js --fetch-file ./jp-request.txt -o ./jp-site --depth 3
```

**It will work perfectly!** ✨
