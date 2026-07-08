
import { useEffect, useCallback } from 'react';

export function useEventBus() {
  const electron = (window as any).electron;

  const subscribe = useCallback((type: string, callback: (event: any) => void) => {
    if (!electron || !electron.ipcRenderer) {
      return () => {};
    }

    const handler = (_event: any, synapseEvent: any) => {
      if (synapseEvent.type === type) {
        callback(synapseEvent);
      }
    };

    electron.ipcRenderer.on('event-bus:event', handler);
    return () => {
      electron.ipcRenderer.removeListener('event-bus:event', handler);
    };
  }, [electron]);

  const publish = useCallback((event: any) => {
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('event-bus:publish', event);
    }
  }, [electron]);

  return { subscribe, publish };
}
