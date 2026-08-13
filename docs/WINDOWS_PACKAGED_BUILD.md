# Windows Packaged Build Fix

## Diagnosis

The Windows ZIP build used `new URL(import.meta.url).pathname` to derive the main-process directory. On Windows, URL pathnames retain a leading slash before the drive letter, such as `/C:/...`, and they do not provide the platform-aware decoding required for spaces and other path characters. That can make the packaged preload and renderer paths resolve incorrectly even though the Linux development build appears healthy.

The native browser surface could also cover the React ORION panel when renderer-reported bounds were applied without preserving the reserved sidebar and AI-panel area. The bounds clamp is now part of the packaged source path as well.

## Changes

`src/main/BrowserWindow.ts` now uses Node's `fileURLToPath(import.meta.url)` to derive `__dirname` and `pathToFileURL(...)` to load the packaged renderer. This is safe for Windows drive-letter paths, spaces, and non-ASCII installation directories.

The Windows electron-builder target now produces both an unpacked directory and an explicit ZIP artifact named `Synapse-Browser-<version>-win-<arch>.zip`.

## Validation

The following checks passed in the Linux build environment:

- `pnpm test --run`: 8 files passed, 31 tests passed.
- `pnpm build`: passed.
- `pnpm exec electron-builder --win zip`: passed.
- ZIP artifact generated at `release-windows/Synapse-Browser-1.0.0-win-x64.zip`.

A native Windows machine is still required for final GUI confirmation of the ZIP. The recommended verification is to extract the ZIP to a path containing spaces, launch `Synapse Browser.exe`, confirm that the ORION panel is visible on the right, open a new tab, and run a harmless prompt. If the panel is still absent, collect `%APPDATA%\synapse-browser\` logs and a screenshot from the packaged process.

## Installation

Do not run the executable from inside the ZIP. Extract the complete ZIP directory first, preserve all files and subdirectories, and then launch `Synapse Browser.exe`. The ZIP contains the Electron runtime and the packaged application payload; copying only the executable will not work.
