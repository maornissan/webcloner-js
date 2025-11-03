import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  startClone: (options: any) => ipcRenderer.invoke('start-clone', options),
  stopClone: () => ipcRenderer.invoke('stop-clone'),
  onCloneProgress: (callback: (message: string) => void) => {
    ipcRenderer.on('clone-progress', (_event, message) => callback(message));
  },
  onCloneComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('clone-complete', (_event, result) => callback(result));
  },
});
