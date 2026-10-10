import * as electron from "electron";
import { autoUpdater } from "electron-updater";

const SIX_HOURS = 6 * 60 * 60 * 1e3;

// Checks GitHub Releases for a newer Synapse build, downloads it in the
// background and installs it the next time the app quits.
export function startAutoUpdates() {
  if (!electron.app.isPackaged || process.env.SYNAPSE_DISABLE_UPDATES === "1") return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", (error) => console.warn("[Updater]", error?.message || error));
  autoUpdater.on("update-downloaded", (info) => {
    console.log(`[Updater] Synapse ${info.version} downloaded; it installs when you quit.`);
  });
  const check = () => autoUpdater.checkForUpdatesAndNotify().catch((error) => console.warn("[Updater]", error?.message || error));
  setTimeout(check, 15e3);
  setInterval(check, SIX_HOURS);
}
