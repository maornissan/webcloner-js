import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import type { ProxyConfig } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".webcloner-js");
const PROXY_CONFIG_FILE = path.join(CONFIG_DIR, "proxy-config.json");

export interface SavedProxyConfig extends ProxyConfig {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProxyConfigStore {
  proxies: Record<string, SavedProxyConfig>;
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
  }
}

/**
 * Load proxy configuration store
 */
async function loadStore(): Promise<ProxyConfigStore> {
  try {
    const data = await fs.readFile(PROXY_CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { proxies: {} };
  }
}

/**
 * Save proxy configuration store
 */
async function saveStore(store: ProxyConfigStore): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(
    PROXY_CONFIG_FILE,
    JSON.stringify(store, null, 2),
    "utf-8"
  );
}

/**
 * Save a proxy configuration with a name
 */
export async function saveProxyConfig(
  name: string,
  config: ProxyConfig
): Promise<void> {
  const store = await loadStore();
  const now = new Date().toISOString();

  const savedConfig: SavedProxyConfig = {
    ...config,
    name,
    createdAt: store.proxies[name]?.createdAt || now,
    updatedAt: now,
  };

  store.proxies[name] = savedConfig;
  await saveStore(store);
}

/**
 * Load a proxy configuration by name
 */
export async function loadProxyConfig(
  name: string
): Promise<ProxyConfig | null> {
  const store = await loadStore();
  const config = store.proxies[name];

  if (!config) {
    return null;
  }

  const proxyConfig: ProxyConfig = {
    host: config.host,
    port: config.port,
  };

  if (config.username) {
    proxyConfig.username = config.username;
  }

  if (config.password) {
    proxyConfig.password = config.password;
  }

  return proxyConfig;
}

/**
 * List all saved proxy configurations
 */
export async function listProxyConfigs(): Promise<SavedProxyConfig[]> {
  const store = await loadStore();
  return Object.values(store.proxies);
}

/**
 * Delete a proxy configuration by name
 */
export async function deleteProxyConfig(name: string): Promise<boolean> {
  const store = await loadStore();

  if (!store.proxies[name]) {
    return false;
  }

  delete store.proxies[name];
  await saveStore(store);
  return true;
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return PROXY_CONFIG_FILE;
}
