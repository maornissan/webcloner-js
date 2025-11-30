#!/usr/bin/env node

import { Command } from "commander";
import { WebsiteCloner } from "./cloner.js";
import type { ClonerConfig, ProxyConfig, Cookie } from "./types.js";
import * as path from "path";
import * as fs from "fs/promises";
import {
  saveProxyConfig,
  loadProxyConfig,
  listProxyConfigs,
  deleteProxyConfig,
  getConfigPath,
} from "./config-manager.js";
import {
  parseRequest,
  parseFetchRequestFromFile,
  formatParsedRequest,
} from "./fetch-parser.js";

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
  .option("--load-proxy <name>", "Load saved proxy configuration by name")
  .option("--save-proxy <name>", "Save current proxy configuration with a name")
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
  .option(
    "--cookie <cookies...>",
    'Cookies in format "name=value" or "name=value;domain=example.com"'
  )
  .option("--cookie-file <path>", "Load cookies from JSON file")
  .option(
    "--fetch <request>",
    "Parse fetch request or curl command from string"
  )
  .option(
    "--fetch-file <path>",
    "Parse fetch request or curl command from file"
  )
  .action(async (url: string, options) => {
    try {
      // Parse fetch request if provided
      let fetchParsed = null;
      if (options.fetch || options.fetchFile) {
        try {
          fetchParsed = options.fetchFile
            ? await parseFetchRequestFromFile(options.fetchFile)
            : parseRequest(options.fetch);

          console.log("✓ Parsed fetch/curl request:");
          console.log(formatParsedRequest(fetchParsed));
          console.log("");

          // Override URL if not explicitly provided
          if (url === options.fetch || url === options.fetchFile) {
            url = fetchParsed.url;
          }
        } catch (error) {
          console.error(
            `❌ Failed to parse request: ${error instanceof Error ? error.message : String(error)}`
          );
          process.exit(1);
        }
      }

      // Parse proxy configuration
      let proxy: ProxyConfig | undefined;

      // Load saved proxy if specified
      if (options.loadProxy) {
        const loadedProxy = await loadProxyConfig(options.loadProxy);
        if (!loadedProxy) {
          console.error(
            `❌ Proxy configuration '${options.loadProxy}' not found`
          );
          process.exit(1);
        }
        proxy = loadedProxy;
        console.log(`✓ Loaded proxy configuration: ${options.loadProxy}`);
      }
      // Otherwise, use command-line proxy options
      else if (options.proxyHost && options.proxyPort) {
        proxy = {
          host: options.proxyHost,
          port: parseInt(options.proxyPort, 10),
        };
        if (options.proxyUser) {
          proxy.username = options.proxyUser;
        }
        if (options.proxyPass) {
          proxy.password = options.proxyPass;
        }

        // Save proxy if requested
        if (options.saveProxy) {
          await saveProxyConfig(options.saveProxy, proxy);
          console.log(`✓ Saved proxy configuration as: ${options.saveProxy}`);
        }
      }

      // Parse custom headers
      const headers: Record<string, string> = {};

      // Add headers from fetch request first
      if (fetchParsed) {
        Object.assign(headers, fetchParsed.headers);
      }

      // Then add/override with CLI headers
      if (options.header) {
        for (const header of options.header) {
          const [key, ...valueParts] = header.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        }
      }

      // Parse cookies
      const cookies: Cookie[] = [];

      // Add cookies from fetch request first
      if (fetchParsed) {
        cookies.push(...fetchParsed.cookies);
      }

      // Load from file if specified
      if (options.cookieFile) {
        try {
          const cookieFileContent = await fs.readFile(
            options.cookieFile,
            "utf-8"
          );
          const loadedCookies = JSON.parse(cookieFileContent);
          if (Array.isArray(loadedCookies)) {
            cookies.push(...loadedCookies);
            console.log(`✓ Loaded ${loadedCookies.length} cookies from file`);
          }
        } catch (error) {
          console.error(
            `❌ Failed to load cookie file: ${error instanceof Error ? error.message : String(error)}`
          );
          process.exit(1);
        }
      }

      // Parse command-line cookies
      if (options.cookie) {
        for (const cookieStr of options.cookie) {
          const parts = cookieStr.split(";");
          const [nameValue, ...attributes] = parts;
          const [name, value] = nameValue.split("=");

          if (name && value) {
            const cookie: Cookie = {
              name: name.trim(),
              value: value.trim(),
            };

            // Parse attributes
            for (const attr of attributes) {
              const [attrName, attrValue] = attr
                .split("=")
                .map((s: string) => s.trim());
              if (attrName.toLowerCase() === "domain" && attrValue) {
                cookie.domain = attrValue;
              } else if (attrName.toLowerCase() === "path" && attrValue) {
                cookie.path = attrValue;
              }
            }

            cookies.push(cookie);
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
        ...(cookies.length > 0 && { cookies }),
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

// Command to list saved proxy configurations
program
  .command("list-proxies")
  .description("List all saved proxy configurations")
  .option("--show-passwords", "Show proxy passwords (hidden by default)")
  .action(async (options) => {
    try {
      const proxies = await listProxyConfigs();

      if (proxies.length === 0) {
        console.log("No saved proxy configurations found.");
        console.log(`Config file: ${getConfigPath()}`);
        return;
      }

      console.log(`\n📋 Saved Proxy Configurations (${proxies.length}):\n`);
      console.log("=".repeat(80));

      for (const proxy of proxies) {
        console.log(`\n🔹 Name: ${proxy.name}`);
        console.log(`   Host: ${proxy.host}`);
        console.log(`   Port: ${proxy.port}`);
        console.log(`   Username: ${proxy.username || "(none)"}`);

        if (options.showPasswords) {
          console.log(`   Password: ${proxy.password || "(none)"}`);
        } else {
          console.log(`   Password: ${proxy.password ? "********" : "(none)"}`);
        }

        console.log(
          `   Created: ${new Date(proxy.createdAt).toLocaleString()}`
        );
        console.log(
          `   Updated: ${new Date(proxy.updatedAt).toLocaleString()}`
        );
      }

      console.log("\n" + "=".repeat(80));
      console.log(`\nConfig file: ${getConfigPath()}`);
      console.log(
        "\nTip: Use --show-passwords to display passwords in plain text"
      );
    } catch (error) {
      console.error(
        "❌ Failed to list proxies:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

// Command to show a specific proxy configuration
program
  .command("show-proxy <name>")
  .description("Show details of a saved proxy configuration")
  .option("--show-password", "Show proxy password (hidden by default)")
  .action(async (name: string, options) => {
    try {
      const proxy = await loadProxyConfig(name);

      if (!proxy) {
        console.error(`❌ Proxy configuration '${name}' not found`);
        process.exit(1);
      }

      console.log(`\n🔹 Proxy Configuration: ${name}\n`);
      console.log("=".repeat(60));
      console.log(`Host:     ${proxy.host}`);
      console.log(`Port:     ${proxy.port}`);
      console.log(`Username: ${proxy.username || "(none)"}`);

      if (options.showPassword) {
        console.log(`Password: ${proxy.password || "(none)"}`);
      } else {
        console.log(`Password: ${proxy.password ? "********" : "(none)"}`);
      }

      console.log("=".repeat(60));
      console.log(
        "\nTip: Use --show-password to display the password in plain text"
      );
    } catch (error) {
      console.error(
        "❌ Failed to show proxy:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

// Command to delete a proxy configuration
program
  .command("delete-proxy <name>")
  .description("Delete a saved proxy configuration")
  .action(async (name: string) => {
    try {
      const deleted = await deleteProxyConfig(name);

      if (!deleted) {
        console.error(`❌ Proxy configuration '${name}' not found`);
        process.exit(1);
      }

      console.log(`✓ Deleted proxy configuration: ${name}`);
    } catch (error) {
      console.error(
        "❌ Failed to delete proxy:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();
