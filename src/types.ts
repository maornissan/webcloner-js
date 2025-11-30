export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface ClonerConfig {
  targetUrl: string;
  outputDir: string;
  proxy?: ProxyConfig;
  maxDepth?: number;
  followExternalLinks?: boolean;
  userAgent?: string;
  delay?: number;
  headers?: Record<string, string>;
  includePatterns?: string[];
  excludePatterns?: string[];
  inlineSvgSprites?: boolean;
  cookies?: Cookie[];
}

export interface DownloadedAsset {
  url: string;
  localPath: string;
  type: string;
}

export interface CloneStats {
  totalPages: number;
  totalAssets: number;
  downloadedPages: number;
  downloadedAssets: number;
  failedDownloads: number;
  startTime: number;
  endTime?: number;
}
