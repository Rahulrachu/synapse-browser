import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: any[]) => void) => {
      const subscription = (event: any, ...args: any[]) => func(...args);
      (func as any)._subscription = subscription;
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      const subscription = (func as any)._subscription || func;
      ipcRenderer.removeListener(channel, subscription);
    },
    publish: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  },
  // Shorthands used by some components
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (event: any, ...args: any[]) => func(...args);
    (func as any)._subscription = subscription;
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  removeListener: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (func as any)._subscription || func;
    ipcRenderer.removeListener(channel, subscription);
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
};

contextBridge.exposeInMainWorld('electron', electronAPI);
