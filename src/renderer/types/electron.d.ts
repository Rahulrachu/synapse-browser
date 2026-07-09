export interface IElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, func: (...args: any[]) => void): () => void;
    once(channel: string, func: (...args: any[]) => void): void;
    removeListener(channel: string, func: (...args: any[]) => void): void;
    publish(channel: string, ...args: any[]): void;
    send(channel: string, ...args: any[]): void;
  };
  // Some components use window.electron.invoke/on directly based on grep
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, func: (...args: any[]) => void): () => void;
  removeListener(channel: string, func: (...args: any[]) => void): void;
  send(channel: string, ...args: any[]): void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
