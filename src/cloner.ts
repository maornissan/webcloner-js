import { Downloader } from "./downloader.js";
import { HTMLParser } from "./parser.js";
import type { ClonerConfig, CloneStats, DownloadedAsset } from "./types.js";
import {
  normalizeUrl,
  isSameOrigin,
  urlToLocalPath,
  getRelativePath,
  matchesPattern,
  delay,
  formatBytes,
  formatDuration,
} from "./utils.js";
import * as fs from "fs/promises";
import * as path from "path";

export class WebsiteCloner {
  private config: ClonerConfig;
  private downloader: Downloader;
  private visitedUrls: Set<string>;
  private downloadedAssets: Map<string, DownloadedAsset>;
  private urlQueue: Array<{ url: string; depth: number }>;
  private stats: CloneStats;
  private baseUrl: string;

  constructor(config: ClonerConfig) {
    this.config = {
      maxDepth: 3,
      followExternalLinks: false,
      delay: 100,
      includePatterns: [],
      excludePatterns: [],
      ...config,
    };

    this.downloader = new Downloader(
      this.config.proxy,
      this.config.userAgent,
      this.config.headers,
      this.config.cookies
    );

    this.visitedUrls = new Set();
    this.downloadedAssets = new Map();
    this.urlQueue = [];
    this.baseUrl = normalizeUrl(this.config.targetUrl);

    this.stats = {
      totalPages: 0,
      totalAssets: 0,
      downloadedPages: 0,
      downloadedAssets: 0,
      failedDownloads: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Start cloning the website
   */
  async clone(): Promise<void> {
    console.log(`🚀 Starting clone of ${this.baseUrl}`);
    console.log(`📁 Output directory: ${this.config.outputDir}`);
    if (this.config.proxy) {
      console.log(
        `🔒 Using proxy: ${this.config.proxy.host}:${this.config.proxy.port}`
      );
    }
    console.log("");

    // Create output directory
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Add initial URL to queue
    this.urlQueue.push({ url: this.baseUrl, depth: 0 });

    // Process queue
    while (this.urlQueue.length > 0) {
      const item = this.urlQueue.shift();
      if (!item) continue;

      await this.processUrl(item.url, item.depth);

      // Delay between requests to be stealthy
      if (this.config.delay && this.config.delay > 0) {
        await delay(this.config.delay);
      }
    }

    // Save URL mapping for reference
    await this.saveUrlMapping();

    // Cleanup browser resources
    await this.downloader.cleanup();

    this.stats.endTime = Date.now();
    this.printStats();
  }

  /**
   * Process a single URL
   */
  private async processUrl(url: string, depth: number): Promise<void> {
    const normalizedUrl = normalizeUrl(url);

    // Skip if already visited
    if (this.visitedUrls.has(normalizedUrl)) {
      return;
    }

    // Skip if exceeds max depth
    if (depth > (this.config.maxDepth || 3)) {
      return;
    }

    // Skip if doesn't match include patterns
    if (this.config.includePatterns && this.config.includePatterns.length > 0) {
      if (!matchesPattern(normalizedUrl, this.config.includePatterns)) {
        return;
      }
    }

    // Skip if matches exclude patterns
    if (this.config.excludePatterns && this.config.excludePatterns.length > 0) {
      if (matchesPattern(normalizedUrl, this.config.excludePatterns)) {
        return;
      }
    }

    // Skip external links if not following them
    if (
      !this.config.followExternalLinks &&
      !isSameOrigin(normalizedUrl, this.baseUrl)
    ) {
      return;
    }

    this.visitedUrls.add(normalizedUrl);
    this.stats.totalPages++;

    console.log(
      `📄 [${this.stats.downloadedPages + 1}] Processing: ${normalizedUrl}`
    );

    try {
      // Download HTML
      const html = await this.downloader.downloadText(normalizedUrl);
      this.stats.downloadedPages++;

      // Parse HTML to extract assets
      const assets = HTMLParser.parseHTML(html, normalizedUrl);

      // Download all assets
      await this.downloadAssets(assets, normalizedUrl);

      // Add links to queue for crawling
      if (depth < (this.config.maxDepth || 3)) {
        for (const link of assets.links) {
          if (!this.visitedUrls.has(normalizeUrl(link))) {
            this.urlQueue.push({ url: link, depth: depth + 1 });
          }
        }
      }

      // Replace URLs in HTML with local paths
      let modifiedHtml = this.replaceUrls(html, normalizedUrl);

      // Inline SVG sprites if enabled (fixes CORS issues with file:// protocol)
      if (this.config.inlineSvgSprites) {
        modifiedHtml = await this.inlineSvgSprites(modifiedHtml, normalizedUrl);
      }

      // Save HTML file
      const localPath = urlToLocalPath(normalizedUrl, this.baseUrl);
      const outputPath = path.join(this.config.outputDir, localPath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, modifiedHtml, "utf-8");

      // Store in downloaded assets map
      this.downloadedAssets.set(normalizedUrl, {
        url: normalizedUrl,
        localPath,
        type: "html",
      });
    } catch (error) {
      this.stats.failedDownloads++;
      console.error(
        `❌ Failed to process ${normalizedUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Download all assets from parsed HTML
   */
  private async downloadAssets(
    assets: ReturnType<typeof HTMLParser.parseHTML>,
    refererUrl: string
  ): Promise<void> {
    const allAssets = [
      ...assets.stylesheets,
      ...assets.scripts,
      ...assets.images,
      ...assets.fonts,
      ...assets.svgSprites,
      ...assets.other,
    ];

    for (const assetUrl of allAssets) {
      await this.downloadAsset(assetUrl, refererUrl);
    }
  }

  /**
   * Download a single asset
   */
  private async downloadAsset(url: string, refererUrl: string): Promise<void> {
    const normalizedUrl = normalizeUrl(url);

    // Skip if already downloaded
    if (this.downloadedAssets.has(normalizedUrl)) {
      return;
    }

    // Skip data URLs
    if (normalizedUrl.startsWith("data:")) {
      return;
    }

    this.stats.totalAssets++;

    try {
      const localPath = urlToLocalPath(normalizedUrl, this.baseUrl);
      const outputPath = path.join(this.config.outputDir, localPath);

      // Determine asset type and if binary
      const assetType = this.getAssetType(normalizedUrl);
      const isBinary = this.isBinaryAsset(normalizedUrl);

      // Download and save with proper resource type
      await this.downloader.downloadAndSave(
        normalizedUrl,
        outputPath,
        isBinary,
        refererUrl,
        assetType
      );

      this.stats.downloadedAssets++;

      // Store in downloaded assets map
      this.downloadedAssets.set(normalizedUrl, {
        url: normalizedUrl,
        localPath,
        type: assetType,
      });

      console.log(`  ✓ Downloaded: ${path.basename(localPath)}`);

      // If it's a CSS file, parse and download referenced assets
      if (normalizedUrl.endsWith(".css")) {
        await this.processCSSFile(outputPath, normalizedUrl);
      }
    } catch (error) {
      this.stats.failedDownloads++;
      console.error(
        `  ✗ Failed to download ${normalizedUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process CSS file to download referenced assets
   */
  private async processCSSFile(
    filePath: string,
    cssUrl: string
  ): Promise<void> {
    try {
      const css = await fs.readFile(filePath, "utf-8");
      const urls = HTMLParser.parseCSS(css, cssUrl);

      // Download all referenced assets
      for (const url of urls) {
        await this.downloadAsset(url, cssUrl);
      }

      // Replace URLs in CSS
      const modifiedCss = this.replaceCSSUrls(css, cssUrl);
      await fs.writeFile(filePath, modifiedCss, "utf-8");
    } catch (error) {
      console.error(
        `  ✗ Failed to process CSS ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Replace URLs in HTML with local paths
   */
  private replaceUrls(html: string, pageUrl: string): string {
    const urlMap = new Map<string, string>();
    const pageLocalPath = urlToLocalPath(pageUrl, this.baseUrl);

    // Build URL map with relative paths
    for (const [url, asset] of this.downloadedAssets) {
      const relativePath = getRelativePath(pageLocalPath, asset.localPath);
      urlMap.set(url, relativePath);
    }

    return HTMLParser.replaceUrlsInHTML(html, urlMap, pageUrl);
  }

  /**
   * Replace URLs in CSS with local paths
   */
  private replaceCSSUrls(css: string, cssUrl: string): string {
    const urlMap = new Map<string, string>();
    const cssLocalPath = urlToLocalPath(cssUrl, this.baseUrl);

    // Build URL map with relative paths
    for (const [url, asset] of this.downloadedAssets) {
      const relativePath = getRelativePath(cssLocalPath, asset.localPath);
      urlMap.set(url, relativePath);
    }

    return HTMLParser.replaceUrlsInCSS(css, urlMap, cssUrl);
  }

  /**
   * Check if asset is binary
   */
  private isBinaryAsset(url: string): boolean {
    const binaryExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".ico",
      ".svg",
      ".woff",
      ".woff2",
      ".ttf",
      ".otf",
      ".eot",
      ".mp4",
      ".webm",
      ".ogg",
      ".mp3",
      ".wav",
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
    ];

    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Get asset type from URL
   */
  private getAssetType(url: string): string {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    const typeMap: Record<string, string> = {
      ".css": "stylesheet",
      ".js": "script",
      ".mjs": "script",
      ".jpg": "image",
      ".jpeg": "image",
      ".png": "image",
      ".gif": "image",
      ".webp": "image",
      ".svg": "image",
      ".ico": "image",
      ".bmp": "image",
      ".avif": "image",
      ".woff": "font",
      ".woff2": "font",
      ".ttf": "font",
      ".otf": "font",
      ".eot": "font",
      ".mp4": "video",
      ".webm": "video",
      ".ogg": "video",
      ".mp3": "audio",
      ".wav": "audio",
      ".m4a": "audio",
    };

    return typeMap[ext] || "other";
  }

  /**
   * Inline SVG sprites into HTML
   */
  private async inlineSvgSprites(
    html: string,
    pageUrl: string
  ): Promise<string> {
    const svgSpriteMap = new Map<string, string>();
    const pageLocalPath = urlToLocalPath(pageUrl, this.baseUrl);

    // Build map of SVG sprite relative paths to their content
    for (const [url, asset] of this.downloadedAssets) {
      if (asset.type === "image" && asset.localPath.endsWith(".svg")) {
        const relativePath = getRelativePath(pageLocalPath, asset.localPath);
        const fullPath = path.join(this.config.outputDir, asset.localPath);

        try {
          const svgContent = await fs.readFile(fullPath, "utf-8");
          svgSpriteMap.set(relativePath, svgContent);
        } catch (error) {
          console.error(`  ⚠ Could not read SVG sprite ${fullPath}`);
        }
      }
    }

    return HTMLParser.inlineSvgSprites(html, svgSpriteMap);
  }

  /**
   * Save URL mapping to file
   */
  private async saveUrlMapping(): Promise<void> {
    const mapping: Record<string, string> = {};
    for (const [url, asset] of this.downloadedAssets) {
      mapping[url] = asset.localPath;
    }

    const mappingPath = path.join(this.config.outputDir, "url-mapping.json");
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2), "utf-8");
  }

  /**
   * Print statistics
   */
  private printStats(): void {
    const duration = this.stats.endTime
      ? this.stats.endTime - this.stats.startTime
      : 0;

    console.log("\n" + "=".repeat(60));
    console.log("📊 Clone Statistics");
    console.log("=".repeat(60));
    console.log(
      `✓ Pages downloaded: ${this.stats.downloadedPages}/${this.stats.totalPages}`
    );
    console.log(
      `✓ Assets downloaded: ${this.stats.downloadedAssets}/${this.stats.totalAssets}`
    );
    console.log(`✗ Failed downloads: ${this.stats.failedDownloads}`);
    console.log(`⏱  Duration: ${formatDuration(duration)}`);
    console.log(`📁 Output: ${this.config.outputDir}`);
    console.log("=".repeat(60));
  }
}
