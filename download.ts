// src/index.ts
import { chromium } from "playwright";
import type {
  Browser,
  Page,
  Route,
  LaunchOptions,
  BrowserContextOptions,
} from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { URL } from "url";

interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

interface ScraperConfig {
  baseUrl: string;
  outputDir?: string;
  proxy?: ProxyConfig;
  headless?: boolean;
  locale?: string;
  timezoneId?: string;
  userAgent?: string;
  waitTime?: number;
  cookies?: Cookie[];
  headers?: Record<string, string>;
  postData?: string;
  method?: string;
}

interface Resource {
  url: string;
  content: Buffer;
  type: string;
}

class WebsiteScraper {
  private browser: Browser | null = null;
  private resources: Map<string, Resource> = new Map();
  private config: Required<ScraperConfig>;

  constructor(config: ScraperConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      outputDir: config.outputDir || "./downloaded_site",
      proxy: config.proxy || undefined,
      headless: config.headless ?? false,
      locale: config.locale || "ja-JP",
      timezoneId: config.timezoneId || "Asia/Tokyo",
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      waitTime: config.waitTime || 5000,
      cookies: config.cookies || [],
      headers: config.headers || {},
      postData: config.postData,
      method: config.method || "GET",
    } as Required<ScraperConfig>;
  }

  async download(): Promise<void> {
    try {
      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        ...(this.config.proxy && { proxy: this.config.proxy }),
      };

      this.browser = await chromium.launch(launchOptions);

      const contextOptions: BrowserContextOptions = {
        locale: this.config.locale,
        timezoneId: this.config.timezoneId,
        userAgent: this.config.userAgent,
        bypassCSP: true, // Bypass Content-Security-Policy
        ignoreHTTPSErrors: true, // Ignore HTTPS errors
      };

      const context = await this.browser.newContext(contextOptions);
      const page: Page = await context.newPage();

      // Add cookies if provided
      if (this.config.cookies && this.config.cookies.length > 0) {
        const parsedUrl = new URL(this.config.baseUrl);
        const cookiesWithDomain = this.config.cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || parsedUrl.hostname,
          path: cookie.path || "/",
        }));
        await context.addCookies(cookiesWithDomain);
        console.log(`🍪 Added ${this.config.cookies.length} cookies`);
      }

      // Set extra headers if provided
      if (this.config.headers && Object.keys(this.config.headers).length > 0) {
        await page.setExtraHTTPHeaders(this.config.headers);
        console.log(
          `📋 Set ${Object.keys(this.config.headers).length} custom headers`
        );
      }

      console.log(`🌐 Connecting to: ${this.config.baseUrl}`);
      console.log(`📤 Method: ${this.config.method}`);
      if (this.config.proxy) {
        console.log(`🔒 Using proxy: ${this.config.proxy.server}`);
      }

      // Intercept all requests to save resources
      await page.route("**/*", async (route: Route) => {
        try {
          // Continue the request first
          await route.continue();

          // Try to get the response after it completes
          const response = await route.fetch();
          const url = route.request().url();

          try {
            const buffer = await response.body();
            const contentType = response.headers()["content-type"] || "";

            this.resources.set(url, {
              url,
              content: buffer,
              type: contentType,
            });
          } catch (bodyError) {
            // Ignore body fetch errors
          }
        } catch (error) {
          // Continue anyway even if interception fails
          try {
            await route.continue();
          } catch (continueError) {
            // Already continued or failed
          }
        }
      });

      // Navigate and follow redirects
      console.log(`🚀 Navigating to: ${this.config.baseUrl}`);

      if (this.config.method === "POST" && this.config.postData) {
        console.log(
          `📦 Sending POST data (${this.config.postData.length} bytes)`
        );

        // Navigate to a blank page first
        await page.goto("about:blank");

        // Create and submit a form with POST data
        await page.evaluate(
          ({ url, postData }) => {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = url;

            // Parse the POST data and create form fields
            const params = new URLSearchParams(postData);
            for (const [key, value] of params.entries()) {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = key;
              input.value = value;
              form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
          },
          {
            url: this.config.baseUrl,
            postData: this.config.postData,
          }
        );

        // Wait for navigation after form submission
        await page.waitForLoadState("networkidle", { timeout: 60000 });
      } else {
        // Navigate with GET request
        const response = await page.goto(this.config.baseUrl, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        // Check if there was a redirect
        if (response) {
          const finalUrl = response.url();
          if (finalUrl !== this.config.baseUrl) {
            console.log(`🔄 Redirected to: ${finalUrl}`);
          }
          console.log(`✅ Status: ${response.status()}`);
        }
      }

      // Get all cookies after navigation (including any set by redirects)
      const currentCookies = await context.cookies();
      console.log(
        `🍪 Total cookies after navigation: ${currentCookies.length}`
      );

      // Log final URL
      const finalUrl = page.url();
      console.log(`📍 Final URL: ${finalUrl}`);

      console.log(
        `⏳ Waiting ${this.config.waitTime}ms for dynamic content...`
      );
      await page.waitForTimeout(this.config.waitTime);

      const html: string = await page.content();
      this.saveResources(html);

      console.log(`✓ Successfully downloaded ${this.resources.size} resources`);
      console.log(`✓ Saved to: ${this.config.outputDir}`);
    } catch (error) {
      console.error("❌ Error during scraping:", error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private saveResources(html: string): void {
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }

    // Save main HTML
    const indexPath = join(this.config.outputDir, "index.html");
    writeFileSync(indexPath, html, "utf-8");
    console.log(`📄 Saved index.html`);

    // Save all other resources
    let saved = 0;
    for (const [url, resource] of this.resources) {
      try {
        const parsedUrl = new URL(url);
        const relativePath = parsedUrl.pathname.slice(1) || "index.html";
        const fullPath = join(this.config.outputDir, relativePath);

        const dir = dirname(fullPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        writeFileSync(fullPath, resource.content);
        saved++;
      } catch (error) {
        console.warn(`⚠️  Failed to save: ${url}`);
      }
    }
    console.log(`📦 Saved ${saved} additional resources`);
  }

  getStats(): { totalResources: number; outputDir: string } {
    return {
      totalResources: this.resources.size,
      outputDir: this.config.outputDir,
    };
  }
}

// Usage example with full fetch request simulation
const scraper = new WebsiteScraper({
  baseUrl: "https://jp.globalbridgeconsultingsas.com/",
  outputDir: "./downloaded_with_proxy",
  proxy: {
    server: "http://rotating.proxyempire.io:9028",
    username: "BBDxQEYaGkHm8n9x",
    password: "wifi;jp;;;",
  },
  headless: false,
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  waitTime: 5000,
  // Initial GET request - no cookies needed, they'll be set by the server
  cookies: [],
  // Add headers from your initial fetch request
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    priority: "u=0, i",
    "sec-ch-ua":
      '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  },
  // Initial GET request
  method: "GET",
});

scraper.download().catch(console.error);
