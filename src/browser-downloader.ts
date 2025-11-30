import puppeteer, { type Browser, type Page, type Protocol } from "puppeteer";
import type { ProxyConfig, Cookie } from "./types.js";
import * as fs from "fs/promises";
import * as path from "path";

export class BrowserDownloader {
  private browser: Browser | null = null;
  private userAgent: string;
  private headers: Record<string, string>;
  private proxy: ProxyConfig | undefined;
  private cookies: Cookie[];
  private collectedCookies: Map<string, Protocol.Network.Cookie[]> = new Map();

  constructor(
    proxy?: ProxyConfig,
    userAgent?: string,
    headers?: Record<string, string>,
    cookies?: Cookie[]
  ) {
    this.userAgent = userAgent || this.getRandomUserAgent();
    this.headers = headers || {};
    this.proxy = proxy ?? undefined;
    this.cookies = cookies || [];
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    ];
    const selected = userAgents[Math.floor(Math.random() * userAgents.length)];
    return selected || userAgents[0] || "";
  }

  async initialize(): Promise<void> {
    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    };

    // Add proxy if configured
    if (this.proxy) {
      const proxyUrl = `${this.proxy.host}:${this.proxy.port}`;
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Convert our Cookie format to Puppeteer's cookie format
   */
  private convertToPuppeteerCookies(
    url: string,
    cookies: Cookie[]
  ): Protocol.Network.CookieParam[] {
    const urlObj = new URL(url);
    return cookies.map((cookie) => {
      const puppeteerCookie: any = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || urlObj.hostname,
        path: cookie.path || "/",
      };

      if (cookie.expires !== undefined) {
        puppeteerCookie.expires = cookie.expires;
      }
      if (cookie.httpOnly !== undefined) {
        puppeteerCookie.httpOnly = cookie.httpOnly;
      }
      if (cookie.secure !== undefined) {
        puppeteerCookie.secure = cookie.secure;
      }
      if (cookie.sameSite !== undefined) {
        puppeteerCookie.sameSite = cookie.sameSite;
      }

      return puppeteerCookie;
    });
  }

  /**
   * Collect cookies from the page after navigation
   */
  private async collectCookies(page: Page, url: string): Promise<void> {
    try {
      const cookies = await page.cookies();
      const domain = new URL(url).hostname;

      // Merge with existing cookies for this domain
      const existing = this.collectedCookies.get(domain) || [];
      const cookieMap = new Map<string, any>();

      // Add existing cookies
      existing.forEach((c: any) => cookieMap.set(c.name, c));

      // Add/update with new cookies
      cookies.forEach((c: any) => cookieMap.set(c.name, c));

      this.collectedCookies.set(domain, Array.from(cookieMap.values()));
    } catch (error) {
      // Ignore cookie collection errors
    }
  }

  /**
   * Get all collected cookies
   */
  getCollectedCookies(): Map<string, any[]> {
    return this.collectedCookies;
  }

  /**
   * Export collected cookies in a format that can be saved
   */
  exportCookies(): Cookie[] {
    const allCookies: Cookie[] = [];
    this.collectedCookies.forEach((cookies) => {
      cookies.forEach((cookie: any) => {
        const exportedCookie: Cookie = {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
        };

        if (cookie.expires !== undefined) {
          exportedCookie.expires = cookie.expires;
        }
        if (cookie.httpOnly !== undefined) {
          exportedCookie.httpOnly = cookie.httpOnly;
        }
        if (cookie.secure !== undefined) {
          exportedCookie.secure = cookie.secure;
        }
        if (
          cookie.sameSite &&
          ["Strict", "Lax", "None"].includes(cookie.sameSite)
        ) {
          exportedCookie.sameSite = cookie.sameSite as
            | "Strict"
            | "Lax"
            | "None";
        }

        allCookies.push(exportedCookie);
      });
    });
    return allCookies;
  }

  /**
   * Download text content with JavaScript execution
   * This handles anti-bot protection that requires JS execution
   */
  async downloadText(
    url: string,
    referer?: string,
    waitForSelector?: string,
    timeout: number = 30000
  ): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();

    try {
      // Set user agent
      await page.setUserAgent(this.userAgent);

      // Set extra headers
      if (Object.keys(this.headers).length > 0) {
        await page.setExtraHTTPHeaders(this.headers);
      }

      // Authenticate proxy if needed
      if (this.proxy?.username && this.proxy?.password) {
        await page.authenticate({
          username: this.proxy.username,
          password: this.proxy.password,
        });
      }

      // Set referer if provided
      if (referer) {
        await page.setExtraHTTPHeaders({ Referer: referer });
      }

      // Set cookies if provided
      if (this.cookies.length > 0) {
        const puppeteerCookies: any = this.convertToPuppeteerCookies(
          url,
          this.cookies
        );
        await page.setCookie(...puppeteerCookies);
      }

      // Also set any previously collected cookies for this domain
      const domain = new URL(url).hostname;
      const previousCookies = this.collectedCookies.get(domain);
      if (previousCookies && previousCookies.length > 0) {
        await page.setCookie(...(previousCookies as any));
      }

      // Navigate to the page
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout,
      });

      // Collect cookies after page load
      await this.collectCookies(page, url);

      // Wait for specific selector if provided (useful for dynamic content)
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // Additional wait to ensure any JS challenges complete
      // This is crucial for anti-bot protection
      await this.waitForProtectionChallenge(page);

      // Get the final HTML after all JS execution
      const html = await page.content();

      return html;
    } finally {
      await page.close();
    }
  }

  /**
   * Wait for common anti-bot protection challenges to complete
   */
  private async waitForProtectionChallenge(page: Page): Promise<void> {
    try {
      // Wait a bit for any immediate redirects or JS execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if we're still on a protection page
      const isProtectionPage = await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const html = document.documentElement.innerHTML;
        // Common indicators of protection pages
        const indicators = [
          "data-digest=",
          "root-app",
          "app-trigger",
          "XMLHttpRequest",
          "decodeUTF8Base64",
          "fingerprint",
          "challenge",
        ];
        return indicators.some((indicator: string) => html.includes(indicator));
      });

      if (isProtectionPage) {
        console.log(
          "  Detected protection challenge, waiting for completion..."
        );

        // Wait for the page to change (protection challenge completes)
        // We'll wait for network to be idle again
        await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {
          // Timeout is okay, we'll proceed anyway
        });

        // Additional wait for any final rendering
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      // If we can't detect or wait, just continue
      console.log("  Could not wait for protection challenge, continuing...");
    }
  }

  /**
   * Download binary content (images, fonts, etc.)
   */
  async downloadBinary(url: string, referer?: string): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();

    try {
      // Set user agent
      await page.setUserAgent(this.userAgent);

      // Authenticate proxy if needed
      if (this.proxy?.username && this.proxy?.password) {
        await page.authenticate({
          username: this.proxy.username,
          password: this.proxy.password,
        });
      }

      // Set referer if provided
      if (referer) {
        await page.setExtraHTTPHeaders({ Referer: referer });
      }

      // Navigate and get the response
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
      });

      if (!response) {
        throw new Error("No response received");
      }

      const buffer = await response.buffer();
      return buffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Download and save file
   */
  async downloadAndSave(
    url: string,
    outputPath: string,
    isBinary: boolean = false,
    referer?: string
  ): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    if (isBinary) {
      const data = await this.downloadBinary(url, referer);
      await fs.writeFile(outputPath, data);
    } else {
      const data = await this.downloadText(url, referer);
      await fs.writeFile(outputPath, data, "utf-8");
    }
  }

  /**
   * Check if a URL requires browser-based downloading
   * This detects common anti-bot protection patterns
   */
  static async requiresBrowser(html: string): Promise<boolean> {
    // Check for common protection patterns
    const protectionPatterns = [
      /data-digest=/i,
      /root-app/i,
      /app-trigger/i,
      /decodeUTF8Base64/i,
      /XMLHttpRequest.*fingerprint/i,
      /challenge/i,
      /cloudflare/i,
      /cf-browser-verification/i,
      /just a moment/i,
      /checking your browser/i,
      /please wait/i,
      /ray id/i,
    ];

    return protectionPatterns.some((pattern) => pattern.test(html));
  }
}
