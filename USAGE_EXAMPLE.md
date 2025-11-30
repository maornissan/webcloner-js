# Usage Example: Your Curl Command

## Your Curl Command

You provided this curl command:

```bash
curl 'https://jp.globalbridgeconsultingsas.com/' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -b 'PHPSESSID=96c6a187abc1f5057af8b51e4122f946; f=bW9uZXlfMTc2Mzk4NjI2MV8zMTE=; _cid=cccd6a960ee241dc859d855808f87a00' \
  -H 'origin: https://jp.globalbridgeconsultingsas.com' \
  -H 'priority: u=0, i' \
  -H 'referer: https://jp.globalbridgeconsultingsas.com/' \
  -H 'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: same-origin' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' \
  --data-raw 'data=%7B%22mode%22%3A%22php%22%2C%22screen%22%3A%7B%22availWidth%22%3A2560%2C%22availHeight%22%3A1400%2C%22width%22%3A2560%2C%22height%22%3A1440%2C%22colorDepth%22%3A24%2C%22pixelDepth%22%3A24%2C%22availLeft%22%3A0%2C%22availTop%22%3A0%2C%22orientation%22%3A%22%5Bobject+ScreenOrientation%5D%22%2C%22onchange%22%3Anull%2C%22isExtended%22%3Atrue%7D%7D'
```

## How to Use It

### Method 1: Save to File (Recommended)

```bash
# 1. Save the curl command to a file
cat > jp-request.txt << 'EOF'
curl 'https://jp.globalbridgeconsultingsas.com/' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -b 'PHPSESSID=96c6a187abc1f5057af8b51e4122f946; f=bW9uZXlfMTc2Mzk4NjI2MV8zMTE=; _cid=cccd6a960ee241dc859d855808f87a00' \
  -H 'origin: https://jp.globalbridgeconsultingsas.com' \
  -H 'priority: u=0, i' \
  -H 'referer: https://jp.globalbridgeconsultingsas.com/' \
  -H 'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: same-origin' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' \
  --data-raw 'data=%7B%22mode%22%3A%22php%22%2C%22screen%22%3A%7B%22availWidth%22%3A2560%2C%22availHeight%22%3A1400%2C%22width%22%3A2560%2C%22height%22%3A1440%2C%22colorDepth%22%3A24%2C%22pixelDepth%22%3A24%2C%22availLeft%22%3A0%2C%22availTop%22%3A0%2C%22orientation%22%3A%22%5Bobject+ScreenOrientation%5D%22%2C%22onchange%22%3Anull%2C%22isExtended%22%3Atrue%7D%7D'
EOF

# 2. Build the project (first time only)
npm run build

# 3. Clone the website
npm run dev -- --fetch-file ./jp-request.txt -o ./jp-site --depth 3

# Or with production build:
node dist/cli.js --fetch-file ./jp-request.txt -o ./jp-site --depth 3
```

### Method 2: Using Electron GUI

```bash
# 1. Start the Electron GUI
npm run start:electron

# 2. In the GUI:
#    - Click "Advanced Settings"
#    - Paste your curl command into "Fetch Request or Curl Command" field
#    - Click "Parse Request"
#    - Verify URL, headers, and cookies are populated
#    - Set output directory
#    - Click "Start Cloning"
```

## What Will Be Extracted

From your curl command, WebCloner will extract:

### URL

```
https://jp.globalbridgeconsultingsas.com/
```

### Cookies (3 cookies)

```json
[
  {
    "name": "PHPSESSID",
    "value": "96c6a187abc1f5057af8b51e4122f946"
  },
  {
    "name": "f",
    "value": "bW9uZXlfMTc2Mzk4NjI2MV8zMTE="
  },
  {
    "name": "_cid",
    "value": "cccd6a960ee241dc859d855808f87a00"
  }
]
```

### Headers (15 headers)

```json
{
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "ja,en-US;q=0.9,en;q=0.8",
  "cache-control": "max-age=0",
  "content-type": "application/x-www-form-urlencoded",
  "origin": "https://jp.globalbridgeconsultingsas.com",
  "priority": "u=0, i",
  "referer": "https://jp.globalbridgeconsultingsas.com/",
  "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "upgrade-insecure-requests": "1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
}
```

### Method

```
POST
```

(Auto-detected from `--data-raw`)

### POST Data

```
data=%7B%22mode%22%3A%22php%22%2C%22screen%22%3A%7B%22availWidth%22%3A2560...
```

## Expected Output

When you run the command, you'll see:

```
✓ Parsed curl command:
URL: https://jp.globalbridgeconsultingsas.com/
Method: POST

Headers:
  accept: text/html,application/xhtml+xml,application/xml;q=0.9...
  accept-language: ja,en-US;q=0.9,en;q=0.8
  cache-control: max-age=0
  content-type: application/x-www-form-urlencoded
  origin: https://jp.globalbridgeconsultingsas.com
  priority: u=0, i
  referer: https://jp.globalbridgeconsultingsas.com/
  sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
  sec-ch-ua-mobile: ?0
  sec-ch-ua-platform: "Windows"
  sec-fetch-dest: document
  sec-fetch-mode: navigate
  sec-fetch-site: same-origin
  upgrade-insecure-requests: 1
  user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...

Cookies:
  PHPSESSID=96c6a187abc1f5057af8b51e4122f946
  f=bW9uZXlfMTc2Mzk4NjI2MV8zMTE=
  _cid=cccd6a960ee241dc859d855808f87a00

🚀 Starting clone of https://jp.globalbridgeconsultingsas.com/
📁 Output directory: /home/linux/code/webcloner-js/jp-site

📄 [1] Processing: https://jp.globalbridgeconsultingsas.com/
  🔒 Anti-bot protection detected, using browser mode...
  ✓ Downloaded: style.css
  ✓ Downloaded: main.js
  ...
```

## Additional Options

You can combine the curl command with other WebCloner options:

### With Proxy

```bash
npm run dev -- --fetch-file ./jp-request.txt \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user username \
  --proxy-pass password \
  -o ./jp-site
```

### With Custom Depth

```bash
npm run dev -- --fetch-file ./jp-request.txt \
  --depth 5 \
  -o ./jp-site
```

### With Delay

```bash
npm run dev -- --fetch-file ./jp-request.txt \
  --delay 1000 \
  -o ./jp-site
```

### With Include/Exclude Patterns

```bash
npm run dev -- --fetch-file ./jp-request.txt \
  --include ".*\\.html" ".*\\.css" \
  --exclude ".*\\.pdf" \
  -o ./jp-site
```

## Troubleshooting

### If cookies expire

Get a fresh curl command from your browser:

1. Open the website in your browser
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh the page
5. Right-click on the main request → Copy as cURL
6. Update your `jp-request.txt` file

### If anti-bot protection is detected

WebCloner will automatically switch to browser mode (Puppeteer) which handles:

- JavaScript challenges
- Cloudflare protection
- Fingerprinting
- Cookie-based verification

### If POST data is too long

The POST data in your curl is URL-encoded and contains screen/window information. This is normal and will be sent with the request.

## Summary

Your curl command is **ready to use** with WebCloner! Just:

1. Save it to `jp-request.txt`
2. Run: `npm run dev -- --fetch-file ./jp-request.txt -o ./jp-site`
3. Wait for the clone to complete
4. Open `jp-site/index.html` in your browser

**All cookies, headers, and POST data will be automatically applied!** 🎉
