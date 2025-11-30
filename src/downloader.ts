import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import type { ProxyConfig, Cookie } from "./types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { URL } from "url";
import { BrowserDownloader } from "./browser-downloader.js";

export class Downloader {
  private axiosInstance: AxiosInstance;
  private userAgent: string;
  private headers: Record<string, string>;
  private browserDownloader: BrowserDownloader | null = null;
  private proxy: ProxyConfig | undefined;
  private cookies: Cookie[];
  private cookieJar: Map<string, string> = new Map();

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

    // Build initial cookie jar
    this.cookies.forEach((cookie) => {
      const key = `${cookie.domain || ""}:${cookie.name}`;
      this.cookieJar.set(key, cookie.value);
    });

    const config: AxiosRequestConfig = {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        "User-Agent": this.userAgent,
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "max-age=0",
        ...this.headers,
      },
      validateStatus: (status: number) => status < 500, // Accept all responses < 500
      withCredentials: true,
    };

    // Configure proxy if provided
    if (proxy) {
      const proxyUrl = this.buildProxyUrl(proxy);
      const httpsAgent = new HttpsProxyAgent(proxyUrl);
      config.httpsAgent = httpsAgent;
      config.proxy = false; // Disable axios default proxy handling
    }

    this.axiosInstance = axios.create(config);
  }

  private buildProxyUrl(proxy: ProxyConfig): string {
    const auth =
      proxy.username && proxy.password
        ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
        : "";
    return `http://${auth}${proxy.host}:${proxy.port}`;
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

  async downloadText(
    url: string,
    referer?: string,
    resourceType?: "document" | "stylesheet" | "script"
  ): Promise<string> {
    try {
      const headers = this.getResourceHeaders(
        url,
        referer,
        resourceType || "document"
      );

      // Add cookies to request
      const cookieHeader = this.getCookieHeader(url);
      if (cookieHeader) {
        headers["Cookie"] = cookieHeader;
      }

      const response = await this.axiosInstance.get(url, {
        headers,
        responseType: "text",
      });

      // Store cookies from response
      this.storeCookiesFromResponse(url, response.headers);

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if the response contains anti-bot protection
      const html = response.data;
      if (await BrowserDownloader.requiresBrowser(html)) {
        console.log("  🔒 Anti-bot protection detected, using browser mode...");
        return await this.downloadWithBrowser(url, referer);
      }

      return html;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Download using browser (Puppeteer) for pages with anti-bot protection
   */
  private async downloadWithBrowser(
    url: string,
    referer?: string
  ): Promise<string> {
    if (!this.browserDownloader) {
      this.browserDownloader = new BrowserDownloader(
        this.proxy,
        this.userAgent,
        this.headers,
        this.cookies
      );
      await this.browserDownloader.initialize();
    }

    const html = await this.browserDownloader.downloadText(url, referer);

    // Update our cookies with any new ones from the browser
    const browserCookies = this.browserDownloader.exportCookies();
    browserCookies.forEach((cookie) => {
      const key = `${cookie.domain || ""}:${cookie.name}`;
      this.cookieJar.set(key, cookie.value);
    });

    return html;
  }

  /**
   * Get cookie header for a URL
   */
  private getCookieHeader(url: string): string {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const cookies: string[] = [];

    this.cookieJar.forEach((value, key) => {
      const [cookieDomain, name] = key.split(":");
      // Match domain or subdomain
      if (
        !cookieDomain ||
        domain.endsWith(cookieDomain) ||
        cookieDomain.endsWith(domain)
      ) {
        cookies.push(`${name}=${value}`);
      }
    });

    return cookies.join("; ");
  }

  /**
   * Store cookies from response headers
   */
  private storeCookiesFromResponse(url: string, headers: any): void {
    const setCookieHeaders = headers["set-cookie"];
    if (!setCookieHeaders) return;

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const cookieArray = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];

    cookieArray.forEach((cookieStr: string) => {
      const parts = cookieStr.split(";")[0]?.split("=");
      if (parts && parts.length >= 2) {
        const name = parts[0]?.trim();
        const value = parts.slice(1).join("=").trim();
        if (name) {
          const key = `${domain}:${name}`;
          this.cookieJar.set(key, value);
        }
      }
    });
  }

  /**
   * Get all collected cookies
   */
  getCollectedCookies(): Cookie[] {
    const cookies: Cookie[] = [];
    this.cookieJar.forEach((value, key) => {
      const parts = key.split(":");
      const domain = parts[0];
      const name = parts[1];
      if (name) {
        const cookie: Cookie = { name, value };
        if (domain) {
          cookie.domain = domain;
        }
        cookies.push(cookie);
      }
    });
    return cookies;
  }

  /**
   * Close browser if it was initialized
   */
  async cleanup(): Promise<void> {
    if (this.browserDownloader) {
      // Get final cookies before closing
      const browserCookies = this.browserDownloader.exportCookies();
      browserCookies.forEach((cookie) => {
        const key = `${cookie.domain || ""}:${cookie.name}`;
        this.cookieJar.set(key, cookie.value);
      });

      await this.browserDownloader.close();
      this.browserDownloader = null;
    }
  }

  async downloadBinary(
    url: string,
    referer?: string,
    resourceType?: "image" | "font" | "media" | "other"
  ): Promise<Buffer> {
    try {
      const headers = this.getResourceHeaders(
        url,
        referer,
        resourceType || "image"
      );

      const response = await this.axiosInstance.get(url, {
        headers,
        responseType: "arraybuffer",
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  async downloadAndSave(
    url: string,
    outputPath: string,
    isBinary: boolean = false,
    referer?: string,
    resourceType?: string
  ): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    if (isBinary) {
      const type = this.mapToResourceType(resourceType, true);
      const data = await this.downloadBinary(
        url,
        referer,
        type as "image" | "font" | "media" | "other"
      );
      await fs.writeFile(outputPath, data);
    } else {
      const type = this.mapToResourceType(resourceType, false);
      const data = await this.downloadText(
        url,
        referer,
        type as "document" | "stylesheet" | "script"
      );
      await fs.writeFile(outputPath, data, "utf-8");
    }
  }

  async getContentType(url: string): Promise<string | undefined> {
    try {
      const response = await this.axiosInstance.head(url);
      return response.headers["content-type"];
    } catch {
      return undefined;
    }
  }

  /**
   * Get appropriate headers for different resource types to mimic browser behavior
   */
  private getResourceHeaders(
    url: string,
    referer?: string,
    resourceType:
      | "document"
      | "stylesheet"
      | "script"
      | "image"
      | "font"
      | "media"
      | "other" = "document"
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    // Always include referer if provided
    if (referer) {
      headers["Referer"] = referer;
      headers["Sec-Fetch-Site"] = this.getSameSite(url, referer);
    } else {
      headers["Sec-Fetch-Site"] = "none";
    }

    // Set Accept header based on resource type
    switch (resourceType) {
      case "document":
        headers["Accept"] =
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
        headers["Sec-Fetch-Dest"] = "document";
        headers["Sec-Fetch-Mode"] = "navigate";
        headers["Upgrade-Insecure-Requests"] = "1";
        break;
      case "stylesheet":
        headers["Accept"] = "text/css,*/*;q=0.1";
        headers["Sec-Fetch-Dest"] = "style";
        headers["Sec-Fetch-Mode"] = "no-cors";
        break;
      case "script":
        headers["Accept"] = "*/*";
        headers["Sec-Fetch-Dest"] = "script";
        headers["Sec-Fetch-Mode"] = "no-cors";
        break;
      case "image":
        headers["Accept"] =
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
        headers["Sec-Fetch-Dest"] = "image";
        headers["Sec-Fetch-Mode"] = "no-cors";
        break;
      case "font":
        headers["Accept"] = "*/*";
        headers["Sec-Fetch-Dest"] = "font";
        headers["Sec-Fetch-Mode"] = "cors";
        headers["Origin"] = referer ? new URL(referer).origin : "";
        break;
      case "media":
        headers["Accept"] = "*/*";
        headers["Sec-Fetch-Dest"] = "video";
        headers["Sec-Fetch-Mode"] = "no-cors";
        headers["Range"] = "bytes=0-";
        break;
      default:
        headers["Accept"] = "*/*";
        headers["Sec-Fetch-Dest"] = "empty";
        headers["Sec-Fetch-Mode"] = "cors";
    }

    return headers;
  }

  /**
   * Determine if request is same-site, same-origin, or cross-site
   */
  private getSameSite(url: string, referer: string): string {
    try {
      const urlObj = new URL(url);
      const refererObj = new URL(referer);

      if (urlObj.origin === refererObj.origin) {
        return "same-origin";
      }

      // Check if same site (same eTLD+1)
      const urlDomain = this.getETLDPlusOne(urlObj.hostname);
      const refererDomain = this.getETLDPlusOne(refererObj.hostname);

      if (urlDomain === refererDomain) {
        return "same-site";
      }

      return "cross-site";
    } catch {
      return "cross-site";
    }
  }

  /**
   * Get eTLD+1 (effective top-level domain + 1 label)
   * Simplified version - just gets last two parts of domain
   */
  private getETLDPlusOne(hostname: string): string {
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }
    return hostname;
  }

  /**
   * Map asset type string to resource type enum
   */
  private mapToResourceType(
    assetType?: string,
    isBinary: boolean = false
  ): string {
    if (!assetType) {
      return isBinary ? "image" : "document";
    }

    const typeMap: Record<string, string> = {
      stylesheet: "stylesheet",
      script: "script",
      image: "image",
      font: "font",
      video: "media",
      audio: "media",
      other: "other",
    };

    return typeMap[assetType] || (isBinary ? "image" : "document");
  }
}
