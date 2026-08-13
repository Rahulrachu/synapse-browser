# Windows Packaged Build Status

## Diagnosis

The packaged Electron window was resolving renderer and preload assets through fragile transformed URL paths. Windows drive-letter paths and packaged `app.asar` locations can fail when treated as URL pathnames. A second risk was renderer startup failing completely when the preload bridge was unavailable.

## Changes

`src/main/BrowserWindow.ts` now derives packaged assets from Electron's absolute `app.getAppPath()` and loads the packaged renderer with Electron's native `loadFile()` API. It also logs missing packaged assets and renderer load failures.

`src/renderer/store/workspaceStore.ts` now handles an unavailable or delayed Electron bridge without preventing the shell and ORION panel from rendering.

The existing native browser-view bounds clamp remains in place so the browser surface preserves the sidebar, top bar, status bar, and ORION panel area.

## Validation

The following checks passed after the changes:

- `pnpm test --run`: 8 files passed, 32 tests passed.
- `pnpm build`: passed.
- `electron-builder --win zip`: produced `Synapse-Browser-1.0.0-win-x64.zip`.
- The same packaged main/preload/renderer bundle was launched as a native Linux Electron distribution. The captured frame visibly showed the Google browser surface and the ORION panel on the right.

The native packaged smoke-test evidence is `/tmp/synapse-linux-native-final.png`.

## Windows boundary

The sandbox is Linux. Wine was used as an additional diagnostic path, but Electron's Chromium compositor did not render a usable window under Wine; the captured frame was black and was not accepted as proof of Windows GUI behavior. Final certification still requires launching the ZIP on a real Windows system.

## Installation

Extract the complete ZIP directory before launching `Synapse Browser.exe`. Do not run the executable from inside the archive or copy only the executable without its adjacent runtime files.

## Repository policy

Only source changes covered by automated tests and the native packaged smoke test are committed. No claim is made that Wine constitutes a native Windows installation test.

## References

[1]: https://www.electronjs.org/docs/latest/api/browser-window
[2]: https://www.electronjs.org/docs/latest/api/app#appgetapppath
[3]: https://www.electronjs.org/docs/latest/api/web-contents#contentsloadfilepath-options
