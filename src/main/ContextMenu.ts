import { Menu, MenuItem, WebContents, clipboard } from 'electron';
import BrowserManager from './BrowserManager';

/**
 * Sets up the context menu for a given WebContents instance.
 * The context menu provides options for navigation, link handling, image handling, text selection, and developer tools.
 * @param webContents The Electron `WebContents` instance to attach the context menu to.
 */
export function setupContextMenu(webContents: WebContents) {
  webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Navigation items
    if (params.mediaType === 'none' && !params.linkURL) {
      menu.append(
        new MenuItem({
          label: 'Back',
          click: () => BrowserManager.goBack(),
          enabled: webContents.canGoBack(),
        })
      );
      menu.append(
        new MenuItem({
          label: 'Forward',
          click: () => BrowserManager.goForward(),
          enabled: webContents.canGoForward(),
        })
      );
      menu.append(
        new MenuItem({
          label: 'Reload',
          click: () => BrowserManager.reload(),
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Link context menu
    if (params.linkURL) {
      menu.append(
        new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            BrowserManager.createTab(params.linkURL);
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Link Address',
          click: () => {
            clipboard.writeText(params.linkURL);
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Image context menu
    if (params.mediaType === 'image') {
      menu.append(
        new MenuItem({
          label: 'Open Image in New Tab',
          click: () => {
            BrowserManager.createTab(params.srcURL);
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Image Address',
          click: () => {
            clipboard.writeText(params.srcURL);
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Text selection
    if (params.selectionText) {
      menu.append(
        new MenuItem({
          label: 'Copy',
          click: () => {
            clipboard.writeText(params.selectionText);
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Edit menu
    menu.append(
      new MenuItem({
        label: 'Cut',
        role: 'cut',
      })
    );
    menu.append(
      new MenuItem({
        label: 'Copy',
        role: 'copy',
      })
    );
    menu.append(
      new MenuItem({
        label: 'Paste',
        role: 'paste',
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));

    // Inspect element
    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        click: () => {
          webContents.inspectElement(params.x, params.y);
        },
      })
    );

    menu.popup();
  });
}
