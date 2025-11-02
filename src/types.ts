export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
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
