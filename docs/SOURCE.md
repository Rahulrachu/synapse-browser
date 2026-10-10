# Where this source came from

The Windows installer published as v1.0 was built from code that was never pushed to this repository. The repository held an older, different codebase.

For 1.0.1 the source was recovered from that installer's `app.asar` (internal version 1.0.6) and split back into modules:

| Part of the app | Folder |
| --- | --- |
| Electron main process (tabs, downloads, storage, profiles, git, projects, IPC) | `src/main/` |
| Browser agent and ORION runtime (planning, safety checks, tools) | `src/main/agent/` |
| Preload bridge (IPC allow-list) | `src/preload/` |
| React UI (layout, tabs, AI panel, home, settings, onboarding) | `src/renderer/` |
| Compiled theme stylesheet from 1.0.6 | `src/renderer/styles/synapse.css` |

The rebuilt main process exposes the same 136 IPC handlers and 175 class methods as the shipped build.

Type annotations don't survive compilation, so the recovered code is plain JavaScript/JSX. `synapse.css` is the compiled Tailwind output, so new styles go in `src/renderer/styles/layout.css`.
