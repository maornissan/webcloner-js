import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { ProxyConfig } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class Downloader {
  private axiosInstance: AxiosInstance;
  private userAgent: string;
  private headers: Record<string, string>;

  constructor(
    proxy?: ProxyConfig,
    userAgent?: string,
    headers?: Record<string, string>
  ) {
    this.userAgent = userAgent || this.getRandomUserAgent();
    this.headers = headers || {};

    const config: AxiosRequestConfig = {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        ...this.headers,
      },
      validateStatus: (status: number) => status < 500, // Accept all responses < 500
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
    const auth = proxy.username && proxy.password
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
      : '';
    return `http://${auth}${proxy.host}:${proxy.port}`;
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    ];
    const selected = userAgents[Math.floor(Math.random() * userAgents.length)];
    return selected || userAgents[0] || '';
  }

  async downloadText(url: string, referer?: string): Promise<string> {
    try {
      const headers: Record<string, string> = {};
      if (referer) {
        headers['Referer'] = referer;
      }

      const response = await this.axiosInstance.get(url, {
        headers,
        responseType: 'text',
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  async downloadBinary(url: string, referer?: string): Promise<Buffer> {
    try {
      const headers: Record<string, string> = {};
      if (referer) {
        headers['Referer'] = referer;
      }

      const response = await this.axiosInstance.get(url, {
        headers,
        responseType: 'arraybuffer',
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
    referer?: string
  ): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    if (isBinary) {
      const data = await this.downloadBinary(url, referer);
      await fs.writeFile(outputPath, data);
    } else {
      const data = await this.downloadText(url, referer);
      await fs.writeFile(outputPath, data, 'utf-8');
    }
  }

  async getContentType(url: string): Promise<string | undefined> {
    try {
      const response = await this.axiosInstance.head(url);
      return response.headers['content-type'];
    } catch {
      return undefined;
    }
  }
}
