
export function useIPC() {
  const electron = window.electron;
  
  const invoke = async (channel: string, ...args: any[]) => {
    if (!electron) {
      console.error(`IPC not available for channel: ${channel}`);
      return null;
    }
    return await electron.ipcRenderer.invoke(channel, ...args);
  };

  const send = (channel: string, ...args: any[]) => {
    if (!electron) {
      console.error(`IPC not available for channel: ${channel}`);
      return;
    }
    electron.ipcRenderer.send(channel, ...args);
  };

  const on = (channel: string, callback: (...args: any[]) => void) => {
    if (!electron) {
      return () => {};
    }
    return electron.ipcRenderer.on(channel, callback);
  };

  return { invoke, send, on };
}
