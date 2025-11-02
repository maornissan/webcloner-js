#!/usr/bin/env node

import { Command } from "commander";
import { WebsiteCloner } from "./cloner.js";
import type { ClonerConfig, ProxyConfig } from "./types.js";
import * as path from "path";

const program = new Command();

program
  .name("webcloner-js")
  .description("Advanced stealthy website cloner with proxy support")
  .version("1.0.0");

program
  .argument("<url>", "Target website URL to clone")
  .option("-o, --output <dir>", "Output directory", "./cloned-site")
  .option("-d, --depth <number>", "Maximum crawl depth", "3")
  .option("--delay <ms>", "Delay between requests in milliseconds", "100")
  .option("--proxy-host <host>", "Proxy host")
  .option("--proxy-port <port>", "Proxy port")
  .option("--proxy-user <username>", "Proxy username")
  .option("--proxy-pass <password>", "Proxy password")
  .option("--user-agent <agent>", "Custom user agent")
  .option("--follow-external", "Follow external links", false)
  .option(
    "--inline-svg",
    "Inline SVG sprites (fixes CORS for local viewing)",
    false
  )
  .option("--include <patterns...>", "Include URL patterns (regex)")
  .option("--exclude <patterns...>", "Exclude URL patterns (regex)")
  .option("--header <header...>", 'Custom headers in format "Key: Value"')
  .action(async (url: string, options) => {
    try {
      // Parse proxy configuration
      let proxy: ProxyConfig | undefined;
      if (options.proxyHost && options.proxyPort) {
        proxy = {
          host: options.proxyHost,
          port: parseInt(options.proxyPort, 10),
          username: options.proxyUser,
          password: options.proxyPass,
        };
      }

      // Parse custom headers
      const headers: Record<string, string> = {};
      if (options.header) {
        for (const header of options.header) {
          const [key, ...valueParts] = header.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        }
      }

      // Build configuration
      const config: ClonerConfig = {
        targetUrl: url,
        outputDir: path.resolve(options.output),
        maxDepth: parseInt(options.depth, 10),
        delay: parseInt(options.delay, 10),
        followExternalLinks: options.followExternal,
        inlineSvgSprites: options.inlineSvg,
        ...(proxy && { proxy }),
        ...(options.userAgent && { userAgent: options.userAgent }),
        includePatterns: options.include || [],
        excludePatterns: options.exclude || [],
        ...(Object.keys(headers).length > 0 && { headers }),
      };

      // Validate URL
      try {
        new URL(url);
      } catch {
        console.error("❌ Invalid URL provided");
        process.exit(1);
      }

      // Create and run cloner
      const cloner = new WebsiteCloner(config);
      await cloner.clone();

      console.log("\n✅ Clone completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error(
        "\n❌ Clone failed:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();
