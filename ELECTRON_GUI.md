# WebCloner Electron GUI

A beautiful, modern desktop application for WebCloner with a minimalistic dark theme.

## Quick Start

### Run the GUI Application

```bash
npm run start:electron
```

### Development Mode (with DevTools)

```bash
npm run dev:electron
```

## Features

### Modern Interface
- **Dark Theme**: Easy on the eyes with a sleek black and blue color scheme
- **Smooth Animations**: Polished transitions and interactions
- **Responsive Layout**: Adapts to different window sizes
- **Real-time Terminal**: Live output showing cloning progress

### Full Feature Support
All CLI features are available in the GUI:

- **Basic Settings**
  - Target URL input with validation
  - Output directory selection with file browser
  - Max crawl depth control
  - Request delay configuration

- **Advanced Options**
  - Custom User Agent
  - Follow external links toggle
  - SVG sprite inlining
  - Proxy configuration (host, port, auth)
  - URL pattern filters (include/exclude with regex)
  - Custom HTTP headers (JSON format)

### User Experience
- **Form Validation**: Real-time input validation
- **Directory Picker**: Native file browser integration
- **Progress Tracking**: Live console output with color-coded messages
- **Status Indicators**: Visual feedback for clone status
- **Collapsible Sections**: Advanced settings hidden by default

## Interface Overview

### Configuration Panel (Left)
- Input fields for all cloning parameters
- Advanced settings toggle for optional features
- Start/Stop buttons with disabled states

### Progress Panel (Right)
- Status badge showing current state (Ready/Cloning/Completed/Failed)
- Terminal-style console output
- Color-coded messages:
  - Blue: Info messages
  - Green: Success messages
  - Red: Error messages
  - Yellow: Warning messages

## Keyboard Shortcuts

- **Cmd/Ctrl + R**: Reload window (development)
- **Cmd/Ctrl + Q**: Quit application

## Technical Details

### Architecture
- **Main Process**: Handles window management and IPC
- **Renderer Process**: Manages UI and user interactions
- **Preload Script**: Secure bridge for IPC communication

### Security
- Context isolation enabled
- Node integration disabled
- Secure IPC through contextBridge

### Build Output
- TypeScript compiled to `dist-electron/`
- Source files remain in `electron/`
- Separate build configuration from CLI

## Troubleshooting

### Application won't start
1. Ensure Electron is installed: `npm install`
2. Build the application: `npm run build:electron`
3. Check for TypeScript errors in the build output

### Window appears blank
- Check that `electron/index.html` exists
- Verify file paths in `main.ts`
- Open DevTools in development mode to see console errors

### Cloning doesn't work
- Verify the CLI works: `npm run build && npm start <url>`
- Check terminal output in the GUI for error messages
- Ensure all dependencies are installed

## Development

### File Structure
```
electron/
├── main.ts          # Main process (window management, IPC)
├── preload.ts       # Secure IPC bridge
├── renderer.ts      # UI logic and event handlers
├── index.html       # Application structure
├── styles.css       # Modern styling
└── README.md        # Detailed documentation
```

### Making Changes
1. Edit TypeScript files in `electron/`
2. Rebuild: `npm run build:electron`
3. Test: `npm run dev:electron`

### Styling Customization
All colors and spacing are defined as CSS variables in `styles.css`:
- `--accent-primary`: Main accent color
- `--bg-primary`: Background color
- `--text-primary`: Text color
- Modify these to customize the theme
