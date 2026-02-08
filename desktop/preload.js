const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  authenticateNotebookLM: (userId) => ipcRenderer.invoke('authenticate-notebooklm', userId),
  completeNotebookLMAuth: (userId) => ipcRenderer.invoke('complete-notebooklm-auth', userId),
  uploadCredentials: (data) => ipcRenderer.invoke('upload-credentials', data),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
