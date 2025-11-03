# WebCloner Electron GUI

A beautiful, modern, and minimalistic desktop application for the WebCloner CLI tool.

## Features

- **Modern UI**: Clean, dark-themed interface with smooth animations
- **Easy Configuration**: Intuitive form-based configuration
- **Real-time Progress**: Live terminal output showing cloning progress
- **Advanced Settings**: Support for all CLI features including:
  - Proxy configuration
  - Custom headers
  - URL patterns (include/exclude)
  - User agent customization
  - SVG inlining
  - External link following

## Running the Application

### Development Mode
```bash
npm run dev:electron
```

### Production Mode
```bash
npm run start:electron
```

## Building from Source

1. Build the TypeScript files:
```bash
npm run build:electron
```

2. Run the application:
```bash
electron dist-electron/main.js
```

## Architecture

- **main.ts**: Electron main process handling window creation and IPC
- **preload.ts**: Secure bridge between main and renderer processes
- **renderer.ts**: Frontend logic handling UI interactions
- **index.html**: Application structure
- **styles.css**: Modern, minimalistic styling

## Security

The application uses Electron's security best practices:
- Context isolation enabled
- Node integration disabled
- Secure IPC communication through preload script
