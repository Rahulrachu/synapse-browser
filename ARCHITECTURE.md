# Synapse Browser Architecture

## 1. Folder Structure

The project will follow a modular folder structure to ensure maintainability and scalability, as specified in the project vision. The main directories will be:

```
./
├── public/             # Static assets (icons, index.html template)
├── src/                # Main application source code
│   ├── main/           # Electron main process code
│   │   ├── background.ts   # Main process entry point
│   │   └── preload.ts      # Preload script for context isolation
│   ├── renderer/       # Electron renderer process (React) code
│   │   ├── assets/         # Images, fonts, other static assets
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Top-level page components (e.g., Browser, Workspace, Settings)
│   │   ├── store/          # State management (e.g., Zustand, Redux Toolkit)
│   │   ├── styles/         # Tailwind CSS configuration and global styles
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main React application component
│   │   └── index.tsx       # Renderer process entry point
│   ├── common/         # Code shared between main and renderer processes (e.g., IPC types, utility types)
│   ├── browser/        # Browser-specific modules (tabs, navigation, webviews)
│   ├── workspace/      # Workspace-specific modules (notes, terminal, file explorer)
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

## 2. Database Schema (SQLite)

SQLite will be used for local metadata storage. The schema will be designed to support the various features outlined in the project vision, including bookmarks, history, notes, prompt history, and project memory. Below is a preliminary schema design.

### `bookmarks` table

Stores user bookmarks.

| Column Name | Data Type | Constraints           | Description                  |
|-------------|-----------|-----------------------|------------------------------|
| `id`        | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unique identifier for the bookmark |
| `url`       | TEXT      | NOT NULL              | The URL of the bookmarked page |
| `title`     | TEXT      | NOT NULL              | The title of the bookmarked page |
| `created_at`| INTEGER   | NOT NULL              | Timestamp of when the bookmark was created |

### `history` table

Stores browsing history.

| Column Name | Data Type | Constraints           | Description                  |
|-------------|-----------|-----------------------|------------------------------|
| `id`        | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unique identifier for the history entry |
| `url`       | TEXT      | NOT NULL              | The URL of the visited page |
| `title`     | TEXT      | NOT NULL              | The title of the visited page |
| `visited_at`| INTEGER   | NOT NULL              | Timestamp of when the page was visited |

### `notes` table

Stores user notes.

| Column Name | Data Type | Constraints           | Description                  |
|-------------|-----------|-----------------------|------------------------------|
| `id`        | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unique identifier for the note |
| `title`     | TEXT      | NOT NULL              | The title of the note        |
| `content`   | TEXT      |                       | The content of the note      |
| `created_at`| INTEGER   | NOT NULL              | Timestamp of creation        |
| `updated_at`| INTEGER   | NOT NULL              | Timestamp of last update     |

### `prompts` table

Stores AI prompt history.

| Column Name | Data Type | Constraints           | Description                  |
|-------------|-----------|-----------------------|------------------------------|
| `id`        | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unique identifier for the prompt |
| `text`      | TEXT      | NOT NULL              | The prompt text              |
| `category`  | TEXT      |                       | Category for the prompt      |
| `created_at`| INTEGER   | NOT NULL              | Timestamp of creation        |

### `projects` table

Stores project-specific memory and context.

| Column Name | Data Type | Constraints           | Description                  |
|-------------|-----------|-----------------------|------------------------------|\n| `id`        | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unique identifier for the project |
| `name`      | TEXT      | NOT NULL UNIQUE       | Name of the project          |
| `goals`     | TEXT      |                       | Project goals                |
| `architecture`| TEXT    |                       | Project architecture notes   |
| `notes`     | TEXT      |                       | General project notes        |
| `decisions` | TEXT      |                       | Key decisions made           |
| `created_at`| INTEGER   | NOT NULL              | Timestamp of creation        |
| `updated_at`| INTEGER   | NOT NULL              | Timestamp of last update     |

## 3. Electron Configuration

The Electron configuration will be managed primarily through `electron.vite.config.ts` and `package.json`. Key aspects include:

*   **Main Process Entry Point**: `src/main/background.ts` will be the main entry point for the Electron process, handling window creation, IPC communication, and other Node.js-specific tasks.
*   **Renderer Process Entry Point**: `src/renderer/index.tsx` will be the entry point for the React application running in the renderer process.
*   **Preload Script**: `src/main/preload.ts` will be used to expose specific APIs from the main process to the renderer process securely, adhering to context isolation principles.
*   **IPC Communication**: `electron.ipcMain` and `electron.ipcRenderer` will be used for secure and efficient communication between the main and renderer processes.
*   **Vite Integration**: `electron-vite` will be used to bundle and optimize both main and renderer processes, providing a fast development experience with HMR.
*   **Native Modules**: If any native Node.js modules are required, they will be configured to be built correctly with Electron.
*   **Build Targets**: The application will be configured to build for Windows, Linux, and macOS, as specified.
*   **Window Management**: Initial window dimensions, frameless window settings, and other browser window options will be configured in the main process.
*   **Security**: Context isolation, `nodeIntegration` set to `false`, and `webview` `webPreferences` will be carefully configured to ensure a secure application.

This architecture provides a solid foundation for building the Synapse Browser, ensuring modularity, maintainability, and adherence to modern development practices.
