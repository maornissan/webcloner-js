import { URL } from 'url';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Normalize URL to ensure consistency
 * This ensures URLs are consistently encoded for map lookups
 */
export function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    const urlObj = new URL(url, baseUrl);
    // Remove hash fragments for consistency
    urlObj.hash = '';
    // Decode and re-encode to ensure consistent encoding
    // This handles cases where URLs might be double-encoded or inconsistently encoded
    const decodedPath = decodeURIComponent(urlObj.pathname);
    urlObj.pathname = encodeURI(decodedPath).replace(/%25/g, '%');
    return urlObj.href;
  } catch {
    return url;
  }
}

/**
 * Check if URL is same origin
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.origin === u2.origin;
  } catch {
    return false;
  }
}

/**
 * Convert URL to local file path
 */
export function urlToLocalPath(url: string, baseUrl: string): string {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    
    // Decode the pathname to handle %20 and other encoded characters
    let localPath = decodeURIComponent(urlObj.pathname);
    
    // Handle query strings by creating a hash
    if (urlObj.search) {
      const hash = crypto.createHash('md5').update(urlObj.search).digest('hex').substring(0, 8);
      const ext = path.extname(localPath) || '.html';
      const basename = path.basename(localPath, ext);
      const dirname = path.dirname(localPath);
      localPath = path.join(dirname, `${basename}_${hash}${ext}`);
    }
    
    // If path ends with /, add index.html
    if (localPath.endsWith('/')) {
      localPath = path.join(localPath, 'index.html');
    }
    
    // If no extension, add .html
    if (!path.extname(localPath)) {
      localPath = `${localPath}.html`;
    }
    
    // Remove leading slash
    localPath = localPath.replace(/^\//, '');
    
    // Add domain prefix if different origin
    if (urlObj.origin !== baseUrlObj.origin) {
      const domain = urlObj.hostname.replace(/[^a-zA-Z0-9-]/g, '_');
      localPath = path.join('external', domain, localPath);
    }
    
    return localPath;
  } catch {
    // Fallback for invalid URLs
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return `assets/${hash}.bin`;
  }
}

/**
 * Get file extension from URL or content type
 */
export function getExtension(url: string, contentType?: string): string {
  // Try to get from URL first
  const urlExt = path.extname(new URL(url).pathname);
  if (urlExt) {
    return urlExt;
  }
  
  // Fallback to content type
  if (contentType) {
    const mimeMap: Record<string, string> = {
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/javascript': '.js',
      'application/json': '.json',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'image/webp': '.webp',
      'image/x-icon': '.ico',
      'font/woff': '.woff',
      'font/woff2': '.woff2',
      'font/ttf': '.ttf',
      'font/otf': '.otf',
      'application/pdf': '.pdf',
    };
    
    const mime = contentType.split(';')[0]?.trim().toLowerCase();
    return mime ? (mimeMap[mime] || '.bin') : '.bin';
  }
  
  return '.bin';
}

/**
 * Calculate relative path between two files
 */
export function getRelativePath(from: string, to: string): string {
  const relativePath = path.relative(path.dirname(from), to);
  // Convert Windows paths to URL paths
  return relativePath.replace(/\\/g, '/');
}

/**
 * Sanitize filename to be filesystem-safe
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, '_').replace(/\.\./g, '_');
}

/**
 * Check if URL matches patterns
 */
export function matchesPattern(url: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(url);
  });
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
