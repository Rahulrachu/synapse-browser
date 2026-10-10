<p align="center"><img src="build/icon.png" width="96" alt="Synapse Browser" /></p>

# Synapse Browser

An AI-first desktop browser for Windows. Tell Synapse what to do: its agent, ORION, works on the current website, checks its progress, and asks before anything consequential, like submitting, buying or posting.

## Download

Get the latest `Synapse-Browser-<version>-Windows-x64-Setup.exe` from [Releases](https://github.com/Rahulrachu/synapse-browser/releases). Installed copies update themselves.

## Highlights

- Chromium tabs with profiles, private tabs, pinning, mute, recently closed and session restore
- A split-screen AI panel you can resize (`Ctrl+Shift+A`)
- An ORION browser agent with origin permissions, prompt-injection filtering and confirmation before risky actions
- Bring your own model: OpenAI, Gemini, Anthropic, OpenRouter or a local provider
- Built-in files, editor, terminal (safe commands only), history, bookmarks and downloads
- Command palette (`Ctrl+K`)
- Crashed tabs recover on their own, only one instance runs at a time, and the packaged UI uses a strict CSP

## Development

```bash
npm install
npm run dev        # run with hot reload
npm run build      # build main, preload and renderer into out/
npm run dist:win   # build the Windows installer into release/
```

Pushing a `v*` tag builds the Windows installer on GitHub Actions and attaches it to the release.

## Project layout

```
src/main/        Electron main process (tabs, storage, downloads, IPC)
src/main/agent/  ORION agent runtime and browser automation
src/main/app/    Hardening (single instance, crash recovery) and auto-update
src/preload/     IPC allow-list bridge
src/renderer/    React UI
```

See [docs/SOURCE.md](docs/SOURCE.md) for how this source matches the shipped app, and [CHANGELOG.md](CHANGELOG.md) for what's new.

## License

MIT © Rahul S R
