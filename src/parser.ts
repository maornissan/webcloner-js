import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface ParsedAssets {
  stylesheets: string[];
  scripts: string[];
  images: string[];
  links: string[];
  fonts: string[];
  svgSprites: string[];
  inlineStyles: string[];
  other: string[];
}

export class HTMLParser {
  /**
   * Parse HTML and extract all assets and links
   */
  static parseHTML(html: string, baseUrl: string): ParsedAssets {
    const $ = cheerio.load(html);
    const assets: ParsedAssets = {
      stylesheets: [],
      scripts: [],
      images: [],
      links: [],
      fonts: [],
      svgSprites: [],
      inlineStyles: [],
      other: [],
    };

    // Extract stylesheets
    $('link[rel="stylesheet"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        assets.stylesheets.push(this.resolveUrl(href, baseUrl));
      }
    });

    // Extract scripts
    $('script[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        assets.scripts.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Extract images
    $('img[src], img[data-src], img[data-lazy-src]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');
      if (src && !src.startsWith('data:')) {
        assets.images.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Extract srcset images
    $('img[srcset], source[srcset]').each((_, elem) => {
      const srcset = $(elem).attr('srcset');
      if (srcset) {
        const urls = this.parseSrcSet(srcset, baseUrl);
        assets.images.push(...urls);
      }
    });

    // Extract background images from inline styles
    $('[style]').each((_, elem) => {
      const style = $(elem).attr('style');
      if (style) {
        const urls = this.extractUrlsFromCSS(style, baseUrl);
        assets.images.push(...urls);
      }
    });

    // Extract SVG sprites (like xlink:href)
    $('use[href], use[xlink\\:href]').each((_, elem) => {
      const href = $(elem).attr('href') || $(elem).attr('xlink:href');
      if (href && href.includes('.svg')) {
        const url = this.resolveUrl(href.split('#')[0] || '', baseUrl);
        if (url) {
          assets.svgSprites.push(url);
        }
      }
    });

    // Extract inline SVG with external references
    $('svg image[href], svg image[xlink\\:href]').each((_, elem) => {
      const href = $(elem).attr('href') || $(elem).attr('xlink:href');
      if (href && !href.startsWith('data:')) {
        assets.images.push(this.resolveUrl(href, baseUrl));
      }
    });

    // Extract links (for crawling)
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        assets.links.push(this.resolveUrl(href, baseUrl));
      }
    });

    // Extract favicons and icons
    $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        assets.images.push(this.resolveUrl(href, baseUrl));
      }
    });

    // Extract video sources
    $('video source[src], video[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        assets.other.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Extract audio sources
    $('audio source[src], audio[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        assets.other.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Extract iframes
    $('iframe[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src && !src.startsWith('about:') && !src.startsWith('javascript:')) {
        assets.other.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Extract object/embed sources
    $('object[data], embed[src]').each((_, elem) => {
      const src = $(elem).attr('data') || $(elem).attr('src');
      if (src) {
        assets.other.push(this.resolveUrl(src, baseUrl));
      }
    });

    return assets;
  }

  /**
   * Parse CSS and extract URLs
   */
  static parseCSS(css: string, baseUrl: string): string[] {
    return this.extractUrlsFromCSS(css, baseUrl);
  }

  /**
   * Extract URLs from CSS content
   */
  private static extractUrlsFromCSS(css: string, baseUrl: string): string[] {
    const urls: string[] = [];
    const urlRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
    let match;

    while ((match = urlRegex.exec(css)) !== null) {
      const url = match[1];
      if (url && !url.startsWith('data:') && !url.startsWith('#')) {
        urls.push(this.resolveUrl(url, baseUrl));
      }
    }

    return urls;
  }

  /**
   * Parse srcset attribute
   */
  private static parseSrcSet(srcset: string, baseUrl: string): string[] {
    const urls: string[] = [];
    const parts = srcset.split(',');

    for (const part of parts) {
      const url = part.trim().split(/\s+/)[0];
      if (url && !url.startsWith('data:')) {
        urls.push(this.resolveUrl(url, baseUrl));
      }
    }

    return urls;
  }

  /**
   * Resolve relative URL to absolute
   */
  private static resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return '';
    }
  }

  /**
   * Replace URLs in HTML content
   */
  static replaceUrlsInHTML(
    html: string,
    urlMap: Map<string, string>,
    baseUrl: string
  ): string {
    const $ = cheerio.load(html);

    // Replace stylesheet links
    $('link[rel="stylesheet"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        const absoluteUrl = this.resolveUrl(href, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        if (localPath) {
          $(elem).attr('href', localPath);
        }
      }
    });

    // Replace script sources
    $('script[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        const absoluteUrl = this.resolveUrl(src, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        if (localPath) {
          $(elem).attr('src', localPath);
        }
      }
    });

    // Replace image sources
    $('img[src]').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src && !src.startsWith('data:')) {
        const absoluteUrl = this.resolveUrl(src, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        if (localPath) {
          $(elem).attr('src', localPath);
        }
      }
    });

    // Replace srcset
    $('img[srcset], source[srcset]').each((_, elem) => {
      const srcset = $(elem).attr('srcset');
      if (srcset) {
        const newSrcset = this.replaceSrcSet(srcset, urlMap, baseUrl);
        $(elem).attr('srcset', newSrcset);
      }
    });

    // Replace SVG sprite references
    $('use[href], use[xlink\\:href]').each((_, elem) => {
      const href = $(elem).attr('href') || $(elem).attr('xlink:href');
      if (href && href.includes('.svg')) {
        const [url, fragment] = href.split('#');
        if (url) {
          const absoluteUrl = this.resolveUrl(url, baseUrl);
          const localPath = urlMap.get(absoluteUrl);
          if (localPath) {
            const newHref = fragment ? `${localPath}#${fragment}` : localPath;
            $(elem).attr('href', newHref);
            $(elem).attr('xlink:href', newHref);
          }
        }
      }
    });

    // Replace inline styles
    $('[style]').each((_, elem) => {
      const style = $(elem).attr('style');
      if (style) {
        const newStyle = this.replaceUrlsInCSS(style, urlMap, baseUrl);
        $(elem).attr('style', newStyle);
      }
    });

    // Replace links
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const absoluteUrl = this.resolveUrl(href, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        if (localPath) {
          $(elem).attr('href', localPath);
        }
      }
    });

    // Replace favicons
    $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        const absoluteUrl = this.resolveUrl(href, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        if (localPath) {
          $(elem).attr('href', localPath);
        }
      }
    });

    return $.html();
  }

  /**
   * Replace URLs in CSS content
   */
  static replaceUrlsInCSS(
    css: string,
    urlMap: Map<string, string>,
    baseUrl: string
  ): string {
    return css.replace(/url\(['"]?([^'")]+)['"]?\)/gi, (match, url) => {
      if (url.startsWith('data:') || url.startsWith('#')) {
        return match;
      }

      const absoluteUrl = this.resolveUrl(url, baseUrl);
      const localPath = urlMap.get(absoluteUrl);
      return localPath ? `url('${localPath}')` : match;
    });
  }

  /**
   * Replace URLs in srcset
   */
  private static replaceSrcSet(
    srcset: string,
    urlMap: Map<string, string>,
    baseUrl: string
  ): string {
    const parts = srcset.split(',');
    const newParts: string[] = [];

    for (const part of parts) {
      const [url, ...rest] = part.trim().split(/\s+/);
      if (url && !url.startsWith('data:')) {
        const absoluteUrl = this.resolveUrl(url, baseUrl);
        const localPath = urlMap.get(absoluteUrl);
        const newUrl = localPath || url;
        newParts.push([newUrl, ...rest].join(' '));
      } else {
        newParts.push(part.trim());
      }
    }

    return newParts.join(', ');
  }

  /**
   * Inline SVG sprites into HTML to avoid CORS issues with file:// protocol
   */
  static async inlineSvgSprites(
    html: string,
    svgSpriteMap: Map<string, string>
  ): Promise<string> {
    const $ = cheerio.load(html);
    
    // Find all unique SVG sprite files referenced
    const spriteFiles = new Set<string>();
    $('use[href], use[xlink\\:href]').each((_, elem) => {
      const href = $(elem).attr('href') || $(elem).attr('xlink:href');
      if (href && href.includes('.svg')) {
        const spriteFile = href.split('#')[0];
        if (spriteFile) {
          spriteFiles.add(spriteFile);
        }
      }
    });

    // Inline each sprite file at the beginning of body
    for (const spriteFile of spriteFiles) {
      const svgContent = svgSpriteMap.get(spriteFile);
      if (svgContent) {
        // Parse the SVG sprite content
        const $svg = cheerio.load(svgContent, { xmlMode: true });
        const svgElement = $svg('svg').first();
        
        // Make the sprite hidden and give it an ID
        svgElement.attr('style', 'display: none;');
        svgElement.attr('aria-hidden', 'true');
        
        // Prepend to body
        $('body').prepend(svgElement.toString());
        
        // Update all references to use local IDs (remove the file path)
        $('use[href], use[xlink\\:href]').each((_, elem) => {
          const href = $(elem).attr('href') || $(elem).attr('xlink:href');
          if (href && href.startsWith(spriteFile)) {
            const fragment = href.split('#')[1];
            if (fragment) {
              $(elem).attr('href', `#${fragment}`);
              $(elem).attr('xlink:href', `#${fragment}`);
            }
          }
        });
      }
    }

    return $.html();
  }
}
