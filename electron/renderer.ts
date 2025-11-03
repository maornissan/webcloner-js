// Type definitions for the exposed API
interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  startClone: (options: any) => Promise<{ success: boolean; error?: string }>;
  stopClone: () => Promise<{ success: boolean }>;
  onCloneProgress: (callback: (message: string) => void) => void;
  onCloneComplete: (callback: (result: any) => void) => void;
}

// Access electronAPI directly from window
const getAPI = () => (window as any).electronAPI as ElectronAPI;

// DOM Elements (will be initialized after DOM loads)
let cloneForm: HTMLFormElement;
let startBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let selectDirBtn: HTMLButtonElement;
let advancedToggle: HTMLButtonElement;
let advancedSettings: HTMLDivElement;
let terminalBody: HTMLDivElement;
let statusBadge: HTMLDivElement;

// State
let isCloning = false;

// Initialize
function init() {
  console.log('Init function called');
  
  // Query DOM elements after DOM is loaded
  cloneForm = document.getElementById('cloneForm') as HTMLFormElement;
  startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  selectDirBtn = document.getElementById('selectDirBtn') as HTMLButtonElement;
  advancedToggle = document.getElementById('advancedToggle') as HTMLButtonElement;
  advancedSettings = document.getElementById('advancedSettings') as HTMLDivElement;
  terminalBody = document.getElementById('terminalBody') as HTMLDivElement;
  statusBadge = document.getElementById('statusBadge') as HTMLDivElement;
  
  console.log('DOM elements:', {
    cloneForm: !!cloneForm,
    startBtn: !!startBtn,
    stopBtn: !!stopBtn,
    selectDirBtn: !!selectDirBtn,
    advancedToggle: !!advancedToggle,
    advancedSettings: !!advancedSettings,
    terminalBody: !!terminalBody,
    statusBadge: !!statusBadge
  });
  
  setupEventListeners();
  setupIPCListeners();
  
  // Add a startup message to terminal
  addTerminalLine('🚀 WebCloner GUI initialized and ready', 'info');
  console.log('Initialization complete');
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Form submission
  cloneForm.addEventListener('submit', handleStartClone);
  console.log('Form submit listener attached');
  
  // Also add direct click listener to start button for debugging
  startBtn.addEventListener('click', (e) => {
    console.log('Start button clicked directly!');
    addTerminalLine('▶️ Start button was clicked', 'info');
  });

  // Stop button
  stopBtn.addEventListener('click', handleStopClone);

  // Directory selection
  selectDirBtn.addEventListener('click', handleSelectDirectory);
  console.log('Directory picker listener attached');

  // Advanced settings toggle
  advancedToggle.addEventListener('click', toggleAdvancedSettings);
  console.log('Advanced toggle listener attached');
  
  console.log('All event listeners set up successfully');
}

function setupIPCListeners() {
  // Listen for progress updates
  getAPI().onCloneProgress((message: string) => {
    addTerminalLine(message);
  });

  // Listen for completion
  getAPI().onCloneComplete((result: any) => {
    isCloning = false;
    updateUIState();

    if (result.success) {
      updateStatus('success', 'Completed');
      addTerminalLine('✅ Clone completed successfully!', 'success');
    } else {
      updateStatus('error', 'Failed');
      addTerminalLine(`❌ Clone failed: ${result.message}`, 'error');
    }
  });
}

async function handleStartClone(e: Event) {
  console.log('handleStartClone called');
  e.preventDefault();

  if (isCloning) {
    console.log('Already cloning, returning');
    return;
  }

  // Get form values
  const url = (document.getElementById('url') as HTMLInputElement).value.trim();
  const outputDir = (document.getElementById('outputDir') as HTMLInputElement).value.trim();
  const depth = (document.getElementById('depth') as HTMLInputElement).value;
  const delay = (document.getElementById('delay') as HTMLInputElement).value;
  const userAgent = (document.getElementById('userAgent') as HTMLInputElement).value.trim();
  const followExternal = (document.getElementById('followExternal') as HTMLInputElement).checked;
  const inlineSvg = (document.getElementById('inlineSvg') as HTMLInputElement).checked;
  
  // Proxy settings
  const proxyHost = (document.getElementById('proxyHost') as HTMLInputElement).value.trim();
  const proxyPort = (document.getElementById('proxyPort') as HTMLInputElement).value.trim();
  const proxyUser = (document.getElementById('proxyUser') as HTMLInputElement).value.trim();
  const proxyPass = (document.getElementById('proxyPass') as HTMLInputElement).value.trim();

  // Patterns
  const includePatternsStr = (document.getElementById('includePatterns') as HTMLInputElement).value.trim();
  const excludePatternsStr = (document.getElementById('excludePatterns') as HTMLInputElement).value.trim();
  const includePatterns = includePatternsStr ? includePatternsStr.split(',').map(p => p.trim()) : [];
  const excludePatterns = excludePatternsStr ? excludePatternsStr.split(',').map(p => p.trim()) : [];

  // Headers
  const headers = (document.getElementById('headers') as HTMLTextAreaElement).value.trim();

  // Validate URL
  try {
    new URL(url);
  } catch {
    addTerminalLine('❌ Invalid URL provided', 'error');
    return;
  }

  // Validate output directory
  if (!outputDir) {
    addTerminalLine('❌ Output directory is required', 'error');
    return;
  }

  // Clear terminal
  clearTerminal();
  addTerminalLine(`Starting clone of ${url}...`, 'info');

  // Update state
  isCloning = true;
  updateUIState();
  updateStatus('running', 'Cloning...');

  // Start cloning
  const options = {
    url,
    outputDir,
    depth,
    delay,
    userAgent,
    followExternal,
    inlineSvg,
    proxyHost,
    proxyPort,
    proxyUser,
    proxyPass,
    includePatterns,
    excludePatterns,
    headers,
  };

  const result = await getAPI().startClone(options);

  if (!result.success && result.error) {
    isCloning = false;
    updateUIState();
    updateStatus('error', 'Failed');
    addTerminalLine(`❌ ${result.error}`, 'error');
  }
}

async function handleStopClone() {
  if (!isCloning) return;

  addTerminalLine('Stopping clone...', 'warning');
  await getAPI().stopClone();
  
  isCloning = false;
  updateUIState();
  updateStatus('idle', 'Stopped');
  addTerminalLine('⚠️ Clone stopped by user', 'warning');
}

async function handleSelectDirectory() {
  const directory = await getAPI().selectDirectory();
  if (directory) {
    (document.getElementById('outputDir') as HTMLInputElement).value = directory;
  }
}

function toggleAdvancedSettings() {
  console.log('toggleAdvancedSettings called');
  const isExpanded = advancedSettings.classList.toggle('expanded');
  advancedToggle.classList.toggle('expanded', isExpanded);
  console.log('Advanced settings expanded:', isExpanded);
}

function updateUIState() {
  startBtn.disabled = isCloning;
  stopBtn.disabled = !isCloning;
  
  // Disable form inputs while cloning
  const inputs = cloneForm.querySelectorAll('input, textarea, button');
  inputs.forEach(input => {
    if (input !== stopBtn) {
      (input as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement).disabled = isCloning;
    }
  });
}

function updateStatus(type: 'idle' | 'running' | 'success' | 'error', text: string) {
  const statusDot = statusBadge.querySelector('.status-dot') as HTMLElement;
  const statusText = statusBadge.querySelector('.status-text') as HTMLElement;

  statusBadge.className = 'status-badge';
  statusBadge.classList.add(`status-${type}`);
  statusText.textContent = text;
}

function addTerminalLine(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const line = document.createElement('div');
  line.className = `terminal-line terminal-${type}`;
  
  const prompt = document.createElement('span');
  prompt.className = 'terminal-prompt';
  prompt.textContent = '$';
  
  const text = document.createElement('span');
  text.textContent = message;
  
  line.appendChild(prompt);
  line.appendChild(text);
  
  terminalBody.appendChild(line);
  
  // Auto-scroll to bottom
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function clearTerminal() {
  terminalBody.innerHTML = '';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
