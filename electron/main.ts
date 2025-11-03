import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { WebsiteCloner } from '../src/cloner.js';
import type { ClonerConfig, ProxyConfig } from '../src/types.js';

// __dirname is available in CommonJS
declare const __dirname: string;

let mainWindow: BrowserWindow | null = null;
let currentCloner: WebsiteCloner | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Load the HTML file
  // __dirname will be dist-electron/electron, HTML is copied to same directory
  const htmlPath = path.join(__dirname, 'index.html');
  mainWindow.loadFile(htmlPath);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) {
    return null;
  }
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Output Directory',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('start-clone', async (_event, options) => {
  try {
    // Parse proxy configuration
    let proxy: ProxyConfig | undefined;
    if (options.proxyHost && options.proxyPort) {
      proxy = {
        host: options.proxyHost,
        port: parseInt(options.proxyPort, 10),
        username: options.proxyUser || undefined,
        password: options.proxyPass || undefined,
      };
    }

    // Parse custom headers
    const headers: Record<string, string> = {};
    if (options.headers) {
      try {
        const parsedHeaders = JSON.parse(options.headers);
        Object.assign(headers, parsedHeaders);
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Build configuration
    const config: ClonerConfig = {
      targetUrl: options.url,
      outputDir: path.resolve(options.outputDir),
      maxDepth: parseInt(options.depth, 10),
      delay: parseInt(options.delay, 10),
      followExternalLinks: options.followExternal,
      inlineSvgSprites: options.inlineSvg,
      ...(proxy && { proxy }),
      ...(options.userAgent && { userAgent: options.userAgent }),
      includePatterns: options.includePatterns || [],
      excludePatterns: options.excludePatterns || [],
      ...(Object.keys(headers).length > 0 && { headers }),
    };

    // Validate URL
    try {
      new URL(options.url);
    } catch {
      throw new Error('Invalid URL provided');
    }

    // Create and run cloner
    currentCloner = new WebsiteCloner(config);
    
    // Intercept console logs to send progress updates
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      mainWindow?.webContents.send('clone-progress', message);
      originalLog(...args);
    };

    await currentCloner.clone();

    // Restore console.log
    console.log = originalLog;

    mainWindow?.webContents.send('clone-complete', {
      success: true,
      message: 'Clone completed successfully!',
    });

    return { success: true };
  } catch (error) {
    mainWindow?.webContents.send('clone-complete', {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    currentCloner = null;
  }
});

ipcMain.handle('stop-clone', async () => {
  // Note: WebsiteCloner doesn't have a stop method, but we can set it to null
  currentCloner = null;
  return { success: true };
});
