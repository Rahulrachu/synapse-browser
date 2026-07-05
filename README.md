# Synapse Browser

## AI-First Productivity Browser

Synapse Browser is a modern desktop browser designed as an AI-focused developer workspace. It aims to provide a unified environment where AI assistants, project files, GitHub, notes, terminals, and documentation are available together, fostering a fast, minimal, and professional user experience.

## Features

### Version 1 (MVP) - AI Workspace

*   Modern browser window with multi-tab browsing
*   Split-screen layout with multiple web panels
*   Bookmark and history support
*   Sidebar navigation
*   Workspace saving
*   Dark and Light modes
*   Integration with AI services like ChatGPT, Gemini, Claude, GitHub, and documentation websites, allowing side-by-side arrangement in 2, 3, or 4-panel modes.

### Workspace Features

*   Notes panel with Markdown editor
*   To-do list
*   Prompt history
*   File explorer with local project folder access
*   Built-in terminal
*   Git integration
*   Quick search and keyboard shortcuts

### UI Requirements

*   Smooth animations and transitions
*   Rounded UI elements
*   Resizable and dockable panels
*   Workspace presets
*   Beautiful loading animations

## Technical Stack

*   **Frontend**: React, TypeScript, Electron, Tailwind CSS, Monaco Editor
*   **Backend**: Node.js
*   **State Management**: Zustand
*   **Storage**: SQLite for local metadata, JSON for other data
*   **Architecture**: Modular with clearly separated components.

## Folder Structure

The project follows a modular structure:

```
./
├── public/             # Static assets (icons, index.html template)
├── src/                # Main application source code
│   ├── main/           # Electron main process code
│   ├── renderer/       # Electron renderer process (React) code
│   ├── common/         # Code shared between main and renderer processes
│   ├── browser/        # Browser-specific modules
│   ├── workspace/      # Workspace-specific modules
│   ├── ai/             # AI integration modules
│   ├── git/            # Git integration modules
│   ├── settings/       # Settings modules
│   ├── themes/         # Theme management
│   ├── storage/        # Database and local storage interactions
│   └── plugins/        # Plugin system (future extension)
├── electron.vite.config.ts # Electron-Vite configuration
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Build Instructions

To set up and run the Synapse Browser project locally, follow these steps:

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm installed on your system.

### 1. Clone the repository

```bash
git clone <repository-url>
cd synapse-browser
```

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install --legacy-peer-deps
```

### 3. Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

This will open the Electron application and its developer tools.

### 4. Build for Production

To build the application for production, which will generate distributable files for Windows, Linux, and macOS:

```bash
npm run build
```

The output will be located in the `dist` directory.

### 5. Package the Application

To package the application into an installer or distributable format (e.g., `.exe`, `.AppImage`, `.dmg`):

```bash
npm run dist
```

This command uses `electron-builder` to create platform-specific packages. The generated files will be in the `release` directory.

## Deliverables

This project provides the foundational architecture and core implementations for the Synapse Browser, including:

1.  **Complete project architecture**: Defined in `ARCHITECTURE.md`.
2.  **Folder structure**: Implemented as described in `ARCHITECTURE.md`.
3.  **UI wireframes**: Conceptualized through React components.
4.  **Database schema**: Defined in `ARCHITECTURE.md`.
5.  **Electron configuration**: Set up in `electron.vite.config.ts` and `package.json`.
6.  **React application**: Core UI components and state management.
7.  **Core browser implementation**: Tab management, navigation, and panel layouts.
8.  **Workspace system**: Notes, to-do list, file explorer, terminal, and prompt history.
9.  **Git integration**: Mocked manager and UI component.
10. **Notes system**: Implemented with CRUD operations.
11. **Prompt history**: Implemented with CRUD operations and categorization.
12. **Settings**: Basic settings panel with theme toggle.
13. **Build instructions**: Provided in this `README.md`.
14. **Production-ready code**: Modular, maintainable, and extensible codebase.
