
export function useIPC() {
  const electron = (window as any).electron;
  
  const invoke = async (channel: string, ...args: any[]) => {
    if (!electron || !electron.ipcRenderer) {
      console.error(`IPC not available for channel: ${channel}`);
      return null;
    }
    return await electron.ipcRenderer.invoke(channel, ...args);
  };

  const send = (channel: string, ...args: any[]) => {
    if (!electron || !electron.ipcRenderer) {
      console.error(`IPC not available for channel: ${channel}`);
      return;
    }
    electron.ipcRenderer.send(channel, ...args);
  };

  const on = (channel: string, callback: (...args: any[]) => void) => {
    if (!electron || !electron.ipcRenderer) {
      return () => {};
    }
    electron.ipcRenderer.on(channel, callback);
    return () => electron.ipcRenderer.removeListener(channel, callback);
  };

  return { invoke, send, on };
}
