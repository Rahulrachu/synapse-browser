import * as electron from "electron";

const isHttpUrl = (url) => /^https?:\/\//i.test(url || "");

// Only one Synapse window: a second launch focuses the existing one instead of
// starting a second process that would fight over the same profile data.
export function enforceSingleInstance(getWindow) {
  if (!electron.app.requestSingleInstanceLock()) {
    electron.app.quit();
    return false;
  }
  electron.app.on("second-instance", () => {
    const window = getWindow();
    if (!window || window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  });
  return true;
}

// The Synapse UI window must never navigate away from its own bundle or open
// arbitrary popups; links leave through the system browser instead.
export function hardenAppWindow(window) {
  const contents = window.webContents;
  contents.on("will-navigate", (event, url) => {
    const current = contents.getURL();
    if (url !== current && !url.startsWith("http://localhost:5173")) {
      event.preventDefault();
      if (isHttpUrl(url)) void electron.shell.openExternal(url);
    }
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) void electron.shell.openExternal(url);
    return { action: "deny" };
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());

  // If the UI renderer crashes, bring it back instead of leaving a blank window.
  let reloads = [];
  contents.on("render-process-gone", (_event, details) => {
    if (details.reason === "clean-exit") return;
    const now = Date.now();
    reloads = reloads.filter((time) => now - time < 6e4);
    reloads.push(now);
    console.error("[Main] UI renderer gone:", details.reason);
    if (reloads.length <= 3) setTimeout(() => !window.isDestroyed() && contents.reload(), 500);
  });
  window.on("unresponsive", () => console.warn("[Main] UI window unresponsive"));
}

export function installProcessGuards() {
  process.on("uncaughtException", (error) => console.error("[Main] Uncaught exception:", error));
  process.on("unhandledRejection", (reason) => console.error("[Main] Unhandled rejection:", reason));
  electron.app.on("web-contents-created", (_event, contents) => {
    // Never let any web content open a new Electron window with its own privileges.
    contents.on("will-attach-webview", (event) => event.preventDefault());
  });
}
