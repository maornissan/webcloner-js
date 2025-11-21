// Type definitions for the exposed API
interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  startClone: (options: any) => Promise<{ success: boolean; error?: string }>;
  stopClone: () => Promise<{ success: boolean }>;
  onCloneProgress: (callback: (message: string) => void) => void;
  onCloneComplete: (callback: (result: any) => void) => void;
  saveProxy: (
    name: string,
    config: any
  ) => Promise<{ success: boolean; error?: string }>;
  loadProxy: (
    name: string
  ) => Promise<{ success: boolean; config?: any; error?: string }>;
  listProxies: () => Promise<{
    success: boolean;
    proxies?: any[];
    error?: string;
  }>;
  deleteProxy: (name: string) => Promise<{ success: boolean; error?: string }>;
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

// Proxy Management Elements
let loadProxyBtn: HTMLButtonElement;
let saveProxyBtn: HTMLButtonElement;
let manageProxiesBtn: HTMLButtonElement;
let toggleProxyPassBtn: HTMLButtonElement;
let loadProxyModal: HTMLDivElement;
let saveProxyModal: HTMLDivElement;
let manageProxiesModal: HTMLDivElement;

// State
let isCloning = false;

// Initialize
function init() {
  console.log("Init function called");

  // Query DOM elements after DOM is loaded
  cloneForm = document.getElementById("cloneForm") as HTMLFormElement;
  startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
  selectDirBtn = document.getElementById("selectDirBtn") as HTMLButtonElement;
  advancedToggle = document.getElementById(
    "advancedToggle"
  ) as HTMLButtonElement;
  advancedSettings = document.getElementById(
    "advancedSettings"
  ) as HTMLDivElement;
  terminalBody = document.getElementById("terminalBody") as HTMLDivElement;
  statusBadge = document.getElementById("statusBadge") as HTMLDivElement;

  // Proxy Management Elements
  loadProxyBtn = document.getElementById("loadProxyBtn") as HTMLButtonElement;
  saveProxyBtn = document.getElementById("saveProxyBtn") as HTMLButtonElement;
  manageProxiesBtn = document.getElementById(
    "manageProxiesBtn"
  ) as HTMLButtonElement;
  toggleProxyPassBtn = document.getElementById(
    "toggleProxyPass"
  ) as HTMLButtonElement;
  loadProxyModal = document.getElementById("loadProxyModal") as HTMLDivElement;
  saveProxyModal = document.getElementById("saveProxyModal") as HTMLDivElement;
  manageProxiesModal = document.getElementById(
    "manageProxiesModal"
  ) as HTMLDivElement;

  console.log("DOM elements:", {
    cloneForm: !!cloneForm,
    startBtn: !!startBtn,
    stopBtn: !!stopBtn,
    selectDirBtn: !!selectDirBtn,
    advancedToggle: !!advancedToggle,
    advancedSettings: !!advancedSettings,
    terminalBody: !!terminalBody,
    statusBadge: !!statusBadge,
  });

  setupEventListeners();
  setupIPCListeners();

  // Add a startup message to terminal
  addTerminalLine("🚀 WebCloner GUI initialized and ready", "info");
  console.log("Initialization complete");
}

function setupEventListeners() {
  console.log("Setting up event listeners...");

  // Form submission
  cloneForm.addEventListener("submit", handleStartClone);
  console.log("Form submit listener attached");

  // Also add direct click listener to start button for debugging
  startBtn.addEventListener("click", (e) => {
    console.log("Start button clicked directly!");
    addTerminalLine("▶️ Start button was clicked", "info");
  });

  // Stop button
  stopBtn.addEventListener("click", handleStopClone);

  // Directory selection
  selectDirBtn.addEventListener("click", handleSelectDirectory);
  console.log("Directory picker listener attached");

  // Advanced settings toggle
  advancedToggle.addEventListener("click", toggleAdvancedSettings);
  console.log("Advanced toggle listener attached");

  // Proxy Management Buttons
  loadProxyBtn.addEventListener("click", openLoadProxyModal);
  saveProxyBtn.addEventListener("click", openSaveProxyModal);
  manageProxiesBtn.addEventListener("click", openManageProxiesModal);
  toggleProxyPassBtn.addEventListener("click", toggleProxyPasswordVisibility);

  // Modal close buttons
  document
    .getElementById("closeLoadModal")
    ?.addEventListener("click", () => closeModal(loadProxyModal));
  document
    .getElementById("closeSaveModal")
    ?.addEventListener("click", () => closeModal(saveProxyModal));
  document
    .getElementById("closeManageModal")
    ?.addEventListener("click", () => closeModal(manageProxiesModal));

  // Save proxy confirm/cancel
  document
    .getElementById("confirmSaveProxy")
    ?.addEventListener("click", handleSaveProxy);
  document
    .getElementById("cancelSaveProxy")
    ?.addEventListener("click", () => closeModal(saveProxyModal));

  // Close modals on background click
  [loadProxyModal, saveProxyModal, manageProxiesModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  console.log("All event listeners set up successfully");
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
      updateStatus("success", "Completed");
      addTerminalLine("✅ Clone completed successfully!", "success");
    } else {
      updateStatus("error", "Failed");
      addTerminalLine(`❌ Clone failed: ${result.message}`, "error");
    }
  });
}

async function handleStartClone(e: Event) {
  console.log("handleStartClone called");
  e.preventDefault();

  if (isCloning) {
    console.log("Already cloning, returning");
    return;
  }

  // Get form values
  const url = (document.getElementById("url") as HTMLInputElement).value.trim();
  const outputDir = (
    document.getElementById("outputDir") as HTMLInputElement
  ).value.trim();
  const depth = (document.getElementById("depth") as HTMLInputElement).value;
  const delay = (document.getElementById("delay") as HTMLInputElement).value;
  const userAgent = (
    document.getElementById("userAgent") as HTMLInputElement
  ).value.trim();
  const followExternal = (
    document.getElementById("followExternal") as HTMLInputElement
  ).checked;
  const inlineSvg = (document.getElementById("inlineSvg") as HTMLInputElement)
    .checked;

  // Proxy settings
  const proxyHost = (
    document.getElementById("proxyHost") as HTMLInputElement
  ).value.trim();
  const proxyPort = (
    document.getElementById("proxyPort") as HTMLInputElement
  ).value.trim();
  const proxyUser = (
    document.getElementById("proxyUser") as HTMLInputElement
  ).value.trim();
  const proxyPass = (
    document.getElementById("proxyPass") as HTMLInputElement
  ).value.trim();

  // Patterns
  const includePatternsStr = (
    document.getElementById("includePatterns") as HTMLInputElement
  ).value.trim();
  const excludePatternsStr = (
    document.getElementById("excludePatterns") as HTMLInputElement
  ).value.trim();
  const includePatterns = includePatternsStr
    ? includePatternsStr.split(",").map((p) => p.trim())
    : [];
  const excludePatterns = excludePatternsStr
    ? excludePatternsStr.split(",").map((p) => p.trim())
    : [];

  // Headers
  const headers = (
    document.getElementById("headers") as HTMLTextAreaElement
  ).value.trim();

  // Validate URL
  try {
    new URL(url);
  } catch {
    addTerminalLine("❌ Invalid URL provided", "error");
    return;
  }

  // Validate output directory
  if (!outputDir) {
    addTerminalLine("❌ Output directory is required", "error");
    return;
  }

  // Clear terminal
  clearTerminal();
  addTerminalLine(`Starting clone of ${url}...`, "info");

  // Update state
  isCloning = true;
  updateUIState();
  updateStatus("running", "Cloning...");

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
    updateStatus("error", "Failed");
    addTerminalLine(`❌ ${result.error}`, "error");
  }
}

async function handleStopClone() {
  if (!isCloning) return;

  addTerminalLine("Stopping clone...", "warning");
  await getAPI().stopClone();

  isCloning = false;
  updateUIState();
  updateStatus("idle", "Stopped");
  addTerminalLine("⚠️ Clone stopped by user", "warning");
}

async function handleSelectDirectory() {
  const directory = await getAPI().selectDirectory();
  if (directory) {
    (document.getElementById("outputDir") as HTMLInputElement).value =
      directory;
  }
}

function toggleAdvancedSettings() {
  console.log("toggleAdvancedSettings called");
  const isExpanded = advancedSettings.classList.toggle("expanded");
  advancedToggle.classList.toggle("expanded", isExpanded);
  console.log("Advanced settings expanded:", isExpanded);
}

function updateUIState() {
  startBtn.disabled = isCloning;
  stopBtn.disabled = !isCloning;

  // Disable form inputs while cloning
  const inputs = cloneForm.querySelectorAll("input, textarea, button");
  inputs.forEach((input) => {
    if (input !== stopBtn) {
      (
        input as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
      ).disabled = isCloning;
    }
  });
}

function updateStatus(
  type: "idle" | "running" | "success" | "error",
  text: string
) {
  const statusDot = statusBadge.querySelector(".status-dot") as HTMLElement;
  const statusText = statusBadge.querySelector(".status-text") as HTMLElement;

  statusBadge.className = "status-badge";
  statusBadge.classList.add(`status-${type}`);
  statusText.textContent = text;
}

function addTerminalLine(
  message: string,
  type: "info" | "success" | "error" | "warning" = "info"
) {
  const line = document.createElement("div");
  line.className = `terminal-line terminal-${type}`;

  const prompt = document.createElement("span");
  prompt.className = "terminal-prompt";
  prompt.textContent = "$";

  const text = document.createElement("span");
  text.textContent = message;

  line.appendChild(prompt);
  line.appendChild(text);

  terminalBody.appendChild(line);

  // Auto-scroll to bottom
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function clearTerminal() {
  terminalBody.innerHTML = "";
}

// Proxy Management Functions
function toggleProxyPasswordVisibility() {
  const proxyPassInput = document.getElementById(
    "proxyPass"
  ) as HTMLInputElement;
  const eyeIcon = document.getElementById("eyeIcon");

  if (!eyeIcon) return;

  if (proxyPassInput.type === "password") {
    proxyPassInput.type = "text";
    eyeIcon.innerHTML =
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  } else {
    proxyPassInput.type = "password";
    eyeIcon.innerHTML =
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
}

function openModal(modal: HTMLDivElement) {
  modal.style.display = "flex";
}

function closeModal(modal: HTMLDivElement) {
  modal.style.display = "none";
}

async function openLoadProxyModal() {
  const result = await getAPI().listProxies();

  if (!result.success || !result.proxies) {
    addTerminalLine("❌ Failed to load proxy list", "error");
    return;
  }

  const proxyListLoad = document.getElementById(
    "proxyListLoad"
  ) as HTMLDivElement;
  proxyListLoad.innerHTML = "";

  if (result.proxies.length === 0) {
    proxyListLoad.innerHTML =
      '<p style="text-align: center; color: #888; padding: 20px;">No saved proxies found.</p>';
  } else {
    result.proxies.forEach((proxy: any) => {
      const item = document.createElement("div");
      item.className = "proxy-item";
      item.innerHTML = `
        <div class="proxy-item-header">
          <div class="proxy-item-name">${proxy.name}</div>
        </div>
        <div class="proxy-item-details">
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Host:</span>
            <span class="proxy-detail-value">${proxy.host}:${proxy.port}</span>
          </div>
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Username:</span>
            <span class="proxy-detail-value">${proxy.username || "(none)"}</span>
          </div>
        </div>
      `;
      item.addEventListener("click", () => loadProxyConfig(proxy.name));
      proxyListLoad.appendChild(item);
    });
  }

  openModal(loadProxyModal);
}

async function loadProxyConfig(name: string) {
  const result = await getAPI().loadProxy(name);

  if (!result.success || !result.config) {
    addTerminalLine(`❌ Failed to load proxy: ${result.error}`, "error");
    return;
  }

  const config = result.config;
  (document.getElementById("proxyHost") as HTMLInputElement).value =
    config.host || "";
  (document.getElementById("proxyPort") as HTMLInputElement).value =
    config.port || "";
  (document.getElementById("proxyUser") as HTMLInputElement).value =
    config.username || "";
  (document.getElementById("proxyPass") as HTMLInputElement).value =
    config.password || "";

  closeModal(loadProxyModal);
  addTerminalLine(`✓ Loaded proxy configuration: ${name}`, "success");
}

async function openSaveProxyModal() {
  const proxyHost = (
    document.getElementById("proxyHost") as HTMLInputElement
  ).value.trim();
  const proxyPort = (
    document.getElementById("proxyPort") as HTMLInputElement
  ).value.trim();

  if (!proxyHost || !proxyPort) {
    addTerminalLine(
      "❌ Please enter proxy host and port before saving",
      "error"
    );
    return;
  }

  (document.getElementById("proxyName") as HTMLInputElement).value = "";
  openModal(saveProxyModal);
}

async function handleSaveProxy() {
  const name = (
    document.getElementById("proxyName") as HTMLInputElement
  ).value.trim();

  if (!name) {
    addTerminalLine(
      "❌ Please enter a name for the proxy configuration",
      "error"
    );
    return;
  }

  const proxyHost = (
    document.getElementById("proxyHost") as HTMLInputElement
  ).value.trim();
  const proxyPort = (
    document.getElementById("proxyPort") as HTMLInputElement
  ).value.trim();
  const proxyUser = (
    document.getElementById("proxyUser") as HTMLInputElement
  ).value.trim();
  const proxyPass = (
    document.getElementById("proxyPass") as HTMLInputElement
  ).value.trim();

  const config = {
    host: proxyHost,
    port: parseInt(proxyPort, 10),
    ...(proxyUser && { username: proxyUser }),
    ...(proxyPass && { password: proxyPass }),
  };

  const result = await getAPI().saveProxy(name, config);

  if (result.success) {
    addTerminalLine(`✓ Saved proxy configuration: ${name}`, "success");
    closeModal(saveProxyModal);
  } else {
    addTerminalLine(`❌ Failed to save proxy: ${result.error}`, "error");
  }
}

async function openManageProxiesModal() {
  const result = await getAPI().listProxies();

  if (!result.success || !result.proxies) {
    addTerminalLine("❌ Failed to load proxy list", "error");
    return;
  }

  const proxyListManage = document.getElementById(
    "proxyListManage"
  ) as HTMLDivElement;
  const noProxiesMessage = document.getElementById(
    "noProxiesMessage"
  ) as HTMLDivElement;

  proxyListManage.innerHTML = "";

  if (result.proxies.length === 0) {
    proxyListManage.style.display = "none";
    noProxiesMessage.classList.add("visible");
  } else {
    proxyListManage.style.display = "flex";
    noProxiesMessage.classList.remove("visible");

    result.proxies.forEach((proxy: any) => {
      const item = document.createElement("div");
      item.className = "proxy-item";
      item.style.cursor = "default";
      item.innerHTML = `
        <div class="proxy-item-header">
          <div class="proxy-item-name">${proxy.name}</div>
          <div class="proxy-item-actions">
            <button class="btn btn-secondary load-btn">Load</button>
            <button class="btn btn-secondary delete-btn" style="background: var(--error);">Delete</button>
          </div>
        </div>
        <div class="proxy-item-details">
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Host:</span>
            <span class="proxy-detail-value">${proxy.host}:${proxy.port}</span>
          </div>
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Username:</span>
            <span class="proxy-detail-value">${proxy.username || "(none)"}</span>
          </div>
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Password:</span>
            <span class="proxy-password-masked">${proxy.password ? "********" : "(none)"}</span>
          </div>
          <div class="proxy-detail-row">
            <span class="proxy-detail-label">Created:</span>
            <span class="proxy-detail-value">${new Date(proxy.createdAt).toLocaleString()}</span>
          </div>
        </div>
      `;

      item.querySelector(".load-btn")?.addEventListener("click", () => {
        loadProxyConfig(proxy.name);
        closeModal(manageProxiesModal);
      });

      item.querySelector(".delete-btn")?.addEventListener("click", async () => {
        if (confirm(`Are you sure you want to delete proxy "${proxy.name}"?`)) {
          await deleteProxyConfig(proxy.name);
        }
      });

      proxyListManage.appendChild(item);
    });
  }

  openModal(manageProxiesModal);
}

async function deleteProxyConfig(name: string) {
  const result = await getAPI().deleteProxy(name);

  if (result.success) {
    addTerminalLine(`✓ Deleted proxy configuration: ${name}`, "success");
    // Refresh the manage modal
    await openManageProxiesModal();
  } else {
    addTerminalLine(`❌ Failed to delete proxy: ${result.error}`, "error");
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
