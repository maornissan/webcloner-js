/**
 * Parse fetch request or curl command from browser DevTools
 */

import type { Cookie } from "./types.js";

export interface ParsedFetchRequest {
  url: string;
  headers: Record<string, string>;
  cookies: Cookie[];
  method: string;
  body?: string;
}

/**
 * Parse a fetch request string from browser DevTools
 */
export function parseFetchRequest(fetchString: string): ParsedFetchRequest {
  // Remove comments and extra whitespace
  const cleaned = fetchString
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "")
    .trim();

  // Extract URL
  const urlMatch = cleaned.match(/fetch\s*\(\s*["']([^"']+)["']/);
  if (!urlMatch || !urlMatch[1]) {
    throw new Error("Could not parse URL from fetch request");
  }
  const url = urlMatch[1];

  // Extract headers object
  const headersMatch = cleaned.match(/"headers"\s*:\s*\{([^}]+)\}/s);
  const headers: Record<string, string> = {};
  const cookies: Cookie[] = [];

  if (headersMatch && headersMatch[1]) {
    const headersStr = headersMatch[1];
    // Match each header line
    const headerLines = headersStr.match(/"([^"]+)"\s*:\s*"([^"]*)"/g);

    if (headerLines) {
      for (const line of headerLines) {
        const match = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
        if (match && match[1] && match[2] !== undefined) {
          const key = match[1];
          const value = match[2];

          // Special handling for cookie header
          if (key.toLowerCase() === "cookie") {
            // Parse cookies from cookie header
            const cookiePairs = value.split(";").map((c) => c.trim());
            for (const pair of cookiePairs) {
              const [name, ...valueParts] = pair.split("=");
              if (name && valueParts.length > 0) {
                cookies.push({
                  name: name.trim(),
                  value: valueParts.join("=").trim(),
                });
              }
            }
          } else {
            headers[key] = value;
          }
        }
      }
    }
  }

  // Extract method
  const methodMatch = cleaned.match(/"method"\s*:\s*"([^"]+)"/);
  const method = methodMatch && methodMatch[1] ? methodMatch[1] : "GET";

  return {
    url,
    headers,
    cookies,
    method,
  };
}

/**
 * Parse a curl command from browser DevTools
 */
export function parseCurlCommand(curlString: string): ParsedFetchRequest {
  // Clean up the curl command
  const cleaned = curlString
    .replace(/\\\n/g, " ") // Remove line continuations
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Extract URL - it's the first argument after 'curl'
  const urlMatch = cleaned.match(/curl\s+['"]([^'"]+)['"]/);
  if (!urlMatch || !urlMatch[1]) {
    throw new Error("Could not parse URL from curl command");
  }
  const url = urlMatch[1];

  const headers: Record<string, string> = {};
  const cookies: Cookie[] = [];
  let method = "GET";
  let body: string | undefined;

  // Extract all -H or --header arguments
  const headerRegex = /-H\s+['"]([^:]+):\s*([^'"]+)['"]/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cleaned)) !== null) {
    if (!headerMatch[1] || headerMatch[2] === undefined) continue;
    const key = headerMatch[1].trim();
    const value = headerMatch[2].trim();

    if (key.toLowerCase() === "cookie") {
      // Parse cookies from cookie header
      const cookiePairs = value.split(";").map((c) => c.trim());
      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.split("=");
        if (name && valueParts.length > 0) {
          cookies.push({
            name: name.trim(),
            value: valueParts.join("=").trim(),
          });
        }
      }
    } else {
      headers[key] = value;
    }
  }

  // Extract cookies from -b or --cookie argument
  const cookieArgMatch = cleaned.match(/-b\s+['"]([^'"]+)['"]/);
  if (cookieArgMatch && cookieArgMatch[1]) {
    const cookiePairs = cookieArgMatch[1].split(";").map((c) => c.trim());
    for (const pair of cookiePairs) {
      const [name, ...valueParts] = pair.split("=");
      if (name && valueParts.length > 0) {
        cookies.push({
          name: name.trim(),
          value: valueParts.join("=").trim(),
        });
      }
    }
  }

  // Extract method from -X or --request
  const methodMatch = cleaned.match(/-X\s+['"]?([A-Z]+)['"]?/);
  if (methodMatch && methodMatch[1]) {
    method = methodMatch[1];
  }

  // Detect POST if --data or --data-raw is present
  if (cleaned.includes("--data") || cleaned.includes("--data-raw")) {
    method = "POST";

    // Extract POST data
    const dataMatch = cleaned.match(/--data(?:-raw)?\s+['"]([^'"]+)['"]/);
    if (dataMatch && dataMatch[1]) {
      body = dataMatch[1];
    }
  }

  const result: ParsedFetchRequest = {
    url,
    headers,
    cookies,
    method,
  };

  if (body !== undefined) {
    result.body = body;
  }

  return result;
}

/**
 * Parse fetch request or curl command from file
 */
export async function parseFetchRequestFromFile(
  filePath: string
): Promise<ParsedFetchRequest> {
  const fs = await import("fs/promises");
  const content = await fs.readFile(filePath, "utf-8");

  // Detect if it's a curl command or fetch request
  if (content.trim().startsWith("curl")) {
    return parseCurlCommand(content);
  }

  return parseFetchRequest(content);
}

/**
 * Auto-detect and parse either fetch request or curl command
 */
export function parseRequest(requestString: string): ParsedFetchRequest {
  const cleaned = requestString.trim();

  if (cleaned.startsWith("curl")) {
    return parseCurlCommand(cleaned);
  }

  return parseFetchRequest(cleaned);
}

/**
 * Format parsed request as CLI arguments
 */
export function formatAsCliArgs(parsed: ParsedFetchRequest): string[] {
  const args: string[] = [parsed.url];

  // Add headers
  for (const [key, value] of Object.entries(parsed.headers)) {
    args.push("--header", `${key}: ${value}`);
  }

  // Add cookies
  for (const cookie of parsed.cookies) {
    let cookieStr = `${cookie.name}=${cookie.value}`;
    if (cookie.domain) {
      cookieStr += `;domain=${cookie.domain}`;
    }
    if (cookie.path) {
      cookieStr += `;path=${cookie.path}`;
    }
    args.push("--cookie", cookieStr);
  }

  return args;
}

/**
 * Format parsed request for display
 */
export function formatParsedRequest(parsed: ParsedFetchRequest): string {
  let output = `URL: ${parsed.url}\n`;
  output += `Method: ${parsed.method}\n\n`;

  if (Object.keys(parsed.headers).length > 0) {
    output += "Headers:\n";
    for (const [key, value] of Object.entries(parsed.headers)) {
      output += `  ${key}: ${value}\n`;
    }
    output += "\n";
  }

  if (parsed.cookies.length > 0) {
    output += "Cookies:\n";
    for (const cookie of parsed.cookies) {
      output += `  ${cookie.name}=${cookie.value}`;
      if (cookie.domain) output += ` (domain: ${cookie.domain})`;
      output += "\n";
    }
  }

  return output;
}
