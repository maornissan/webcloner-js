import { copyFileSync, renameSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy HTML and CSS to dist-electron/electron
const files = [
  { src: 'electron/index.html', dest: 'dist-electron/electron/index.html' },
  { src: 'electron/styles.css', dest: 'dist-electron/electron/styles.css' }
];

files.forEach(({ src, dest }) => {
  try {
    copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
  }
});

// Rename all .js files to .cjs in dist-electron to work with "type": "module"
const distElectronDir = 'dist-electron';
function renameJsToCjs(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        renameJsToCjs(fullPath);
      } else if (entry.name.endsWith('.js')) {
        // Read file content and replace .js extensions in require statements
        try {
          let content = readFileSync(fullPath, 'utf8');
          // Replace require('./something.js') with require('./something.cjs')
          // Replace require('../something.js') with require('../something.cjs')
          content = content.replace(/require\(["']([^"']+)\.js["']\)/g, 'require("$1.cjs")');
          writeFileSync(fullPath, content, 'utf8');
        } catch (err) {
          console.error(`Failed to update imports in ${fullPath}:`, err.message);
        }
        
        // Rename the file
        const newPath = fullPath.replace(/\.js$/, '.cjs');
        renameSync(fullPath, newPath);
        console.log(`Renamed ${fullPath} to ${newPath}`);
      }
    });
  } catch (err) {
    console.error(`Failed to rename files in ${dir}:`, err.message);
  }
}

renameJsToCjs(distElectronDir);
