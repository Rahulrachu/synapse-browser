# Synapse Browser: The AI-First Productivity Workspace

Synapse Browser is a professional-grade desktop browser engineered for developers and AI enthusiasts. It transcends traditional browsing by integrating a powerful **Multi-Agent AI System**, a sophisticated **Workspace Engine**, and a full suite of **Developer Tools** into a single, cohesive environment. Built on Electron and React, Synapse is designed for high-performance productivity, enabling seamless context switching between browsing, coding, and AI-assisted research.

---

## 🚀 Status: Production Ready

Synapse Browser has successfully passed a comprehensive engineering audit and functional verification cycle. All core systems, including the multi-tab rendering engine, IPC bridge, and AI orchestration layer, are stabilized and verified for production use.

### Recent Engineering Highlights (v1.0.1)
- **Architectural Stabilization**: Resolved critical IPC memory leaks and duplicate handler registrations.
- **Production Build Engine**: Fixed asset pathing and WebContentsView attachment logic for reliable distribution.
- **UI/UX Refinement**: Implemented intelligent overlay visibility logic and fixed keyboard shortcut bindings for Command Palette and AI Assistant.
- **Workspace Integration**: Verified end-to-end functionality of Git integration, terminal emulation, and split-panel layouts.

---

## ✨ Key Features

### 🧠 Autonomous Multi-Agent System
Synapse features a sophisticated AI orchestration layer that manages specialized agents for complex tasks:
- **Planner Agent**: Decomposes high-level goals into executable task sequences.
- **Browser Agent**: Navigates the web, extracts data, and performs automated actions.
- **Coding & Research Agents**: specialized for deep technical work and information synthesis.
- **Shared Memory**: Utilizes long-term memory with vector embeddings for persistent context across sessions.

### 🪟 Advanced Workspace Engine
Transform your browser into a command center with flexible layout management:
- **Dynamic Split-Panels**: Support for 2, 3, or 4-panel layouts with horizontal and vertical splitting.
- **Workspace Presets**: Save and restore entire environment states, including open tabs and panel arrangements.
- **Tab Groups & Pinning**: Organize high-volume browsing with color-coded groups and persistent pinned tabs.

### 🛠️ Developer-Centric Tooling
Built-in tools to keep you in the flow:
- **Monaco Editor**: High-performance code editing with syntax highlighting and auto-save.
- **Integrated Git**: Full visibility into repository status, commit history, and branch management.
- **Command Palette**: A unified interface (Ctrl+K) to access over 50 built-in commands and system actions.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Core Engine** | Electron 43, Node.js |
| **UI Framework** | React 19, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **State Management** | Zustand |
| **Build Pipeline** | Vite, electron-builder |

---

## 🏗 Project Structure

```text
src/
├── main/              # Electron main process (Background, Window, IPC)
├── renderer/          # React UI (Components, Hooks, Store)
├── common/            # Shared utilities and type definitions
├── engine/            # AI Context and Planning engines
├── agents/            # Specialized AI agent implementations
└── tools/             # System and browser automation tools
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Installation
```bash
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser
npm install --legacy-peer-deps
```

### Development Mode
```bash
npm run dev
```

### Production Build & Packaging
```bash
# Build optimized assets
npm run build

# Generate platform-specific installers (AppImage, .deb, .exe, .dmg)
npm run dist
```

---

## ⌨️ Essential Shortcuts

| Action | Shortcut |
|---|---|
| **Command Palette** | `Ctrl + K` |
| **Settings** | `Ctrl + ,` |
| **AI Assistant** | `Ctrl + Shift + A` |
| **New Tab** | `Ctrl + T` |
| **Git Panel** | `Ctrl + G` |
| **Toggle Theme** | `Ctrl + Shift + D` |
| **Developer Tools** | `F12` |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Rahul S R** - [GitHub Profile](https://github.com/Rahulrachu)

---

## 🌟 Acknowledgments

Synapse Browser is made possible by the incredible open-source communities behind Electron, React, and the various AI research labs providing the models that power our agents.
