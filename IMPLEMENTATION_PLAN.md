# Synapse Browser Roadmap: Architectural Design and Implementation Plan

This document outlines the architectural design and implementation plan for the Synapse Browser roadmap, focusing on transforming it into an AI-first developer workspace. The plan is structured according to the phases provided in the roadmap, detailing how each feature will be integrated into the existing Electron, React, and TypeScript architecture.

## Overall Approach

The implementation will follow an iterative approach, with each phase building upon the previous one. Key principles include:

1.  **Modularity**: Design new components and services to be modular and loosely coupled, facilitating easier maintenance and future extensions.
2.  **IPC Communication**: Leverage Electron's Inter-Process Communication (IPC) for secure and efficient data exchange between the main and renderer processes.
3.  **State Management**: Utilize Zustand for managing application state in the renderer process, ensuring reactivity and predictability.
4.  **Reusability**: Identify and reuse existing components and utilities where possible to minimize code duplication.
5.  **Test-Driven Development (TDD)**: Implement unit and integration tests for new features to ensure stability and correctness.

## Phase I.1: AI Workspace (Multi-panel, Dockable Panels, Layouts, Save/Restore)

**Goal**: Enhance the existing AI Workspace to support multi-panel layouts, dockable panels, and the ability to save and restore workspace configurations.

**Current State Analysis**:

*   `src/renderer/components/AIWorkspace.tsx`: Currently a basic component for managing AI service panels, primarily focused on adding/removing predefined or custom AI chat services. It does not handle layout or docking.
*   `src/renderer/components/MultiPanelLayout.tsx`: Handles rendering multiple resizable panels based on `panelCount` and `splitPanels` from `panelStore`.
*   `src/renderer/store/panelStore.ts`: Manages the active panel and split panel configurations (`left`, `right`, `top`, `bottom`). It has `setPanelLayout` and `restorePanelState` actions.
*   `src/renderer/components/WorkspaceLayoutManager.tsx`: Provides UI for saving and loading workspace layouts, interacting with the main process via IPC.
*   `src/main/PanelManager.ts`: Manages the persistence of workspace layouts in `workspace-layouts.json` and provides CRUD operations for them.

**Implementation Plan**:

1.  **Enhance `AIWorkspace.tsx`**: Refactor `AIWorkspace.tsx` to integrate with the `MultiPanelLayout` system. Instead of directly rendering AI service cards, it will manage instances of AI chat panels that can be placed within the `MultiPanelLayout`.
2.  **Create `AIChatPanel.tsx`**: Develop a new component `AIChatPanel.tsx` that represents an individual AI chat interface. This panel will be responsible for displaying conversation history and allowing user input. It will communicate with the main process's `AIServiceManager` for AI interactions.
3.  **Dockable Panels**: Implement docking functionality using a library or custom solution. This will involve modifying `MultiPanelLayout.tsx` and `ResizablePanel.tsx` to allow panels to be dragged and dropped into different slots or new split views.
4.  **Workspace Layouts (Save/Restore)**: The existing `WorkspaceLayoutManager.tsx` and `PanelManager.ts` already provide the foundation for saving and restoring layouts. We will extend these to include the specific configurations of AI Workspace panels (e.g., which AI chat is open in which panel).
    *   Modify the `WorkspaceLayout` schema in `src/main/PanelManager.ts` to store more granular information about the content of each panel, especially for AI Workspace panels.
    *   Update `WorkspaceLayoutManager.tsx` to correctly serialize and deserialize the enhanced layout data.
5.  **Project Explorer Panel**: Create a new `ProjectExplorerPanel.tsx` component that integrates with `ProjectManager` in the main process to display the project file structure.
6.  **Terminal Panel**: Create a `TerminalPanel.tsx` component that embeds a functional terminal (e.g., using `xterm.js` and a pseudo-terminal in the main process).
7.  **Notes Panel**: Integrate the existing notes functionality into a `NotesPanel.tsx` component.
8.  **Live Preview Panel**: Develop a `LivePreviewPanel.tsx` that can render web content or markdown files in real-time.

## Phase I.2 & I.4: Project Intelligence and Project Memory

**Goal**: Implement automatic project analysis, dependency graphing, entry point detection, and persistent storage for project-related information.

**Current State Analysis**:

*   `src/main/ProjectManager.ts`: Currently handles basic project CRUD operations and file system interactions (listing, reading, writing files). It lacks any intelligence features.
*   `src/engine/MemorySystem.ts`: Provides a generic memory store for facts, preferences, and history, backed by `memory.json`. It has capabilities for generating embeddings and semantic search.
*   `src/engine/ContextEngine.ts`: Tracks active tabs, open files, git status, and current project, providing a basic context summary.

**Implementation Plan**:

1.  **Project Analysis Service (Main Process)**: Create a new service (e.g., `src/main/ProjectIntelligenceService.ts`) that will be responsible for:
    *   **Language/Framework Detection**: Use libraries like `linguist` or custom logic to identify programming languages and frameworks within a repository.
    *   **Dependency Graph**: Analyze `package.json`, `tsconfig.json`, or other manifest files to build a dependency graph. This might involve parsing ASTs for more complex projects.
    *   **Architecture Map**: Generate a high-level architecture map based on file structure, module imports, and detected frameworks.
    *   **Entry Point Detection**: Identify common entry points (e.g., `main.ts`, `index.js`, `App.tsx`).
    *   **Build Scripts**: Parse `package.json` scripts or `Makefile`s to find build commands.
    *   **Test Framework Detection**: Identify testing frameworks (e.g., `vitest`, `jest`).
    *   **Project Summary Generation**: Synthesize all gathered information into a concise project summary.
2.  **Integrate with `ProjectManager.ts`**: Extend `ProjectManager.ts` to trigger the `ProjectIntelligenceService` when a repository is opened and store the analysis results.
3.  **Project Memory Integration**: Utilize `src/engine/MemorySystem.ts` to store project summaries, design decisions, TODOs, and frequently used commands. This will involve:
    *   Defining new `MemoryEntry` types for project intelligence data.
    *   Implementing IPC handlers to allow the renderer process to store and retrieve project memories.
4.  **User Preferences & Conversations**: Extend `MemorySystem.ts` or create a dedicated `UserPreferenceManager.ts` to store user preferences and previous conversations, linking them to specific projects where applicable.
5.  **Repository Knowledge Base**: Build a searchable knowledge base within the `MemorySystem` for project-specific information.

## Phase I.3 & I.5 & I.6: AI Sidebar, Command Palette, Context Engine v2

**Goal**: Create a persistent AI sidebar, enhance the command palette with natural language commands, and improve the context engine for richer context handling.

**Current State Analysis**:

*   `src/renderer/components/Sidebar.tsx`: The main navigation sidebar.
*   `src/renderer/components/CommandPalette.tsx`: Provides a global search and command execution interface.
*   `src/engine/ContextEngine.ts`: A minimal context singleton that tracks basic UI states.
*   `src/agents/`: Contains various AI agents (Planner, Browser, Research, Coding, Reviewer).

**Implementation Plan**:

1.  **AI Sidebar**: Create a new `AISidebar.tsx` component that will be a persistent panel, likely integrated into the `Sidebar.tsx` or as a dockable panel.
    *   **Explain Current File/Selected Code**: Implement functionality to send the content of the current file or selected code to an AI agent (e.g., `CodingAgent`) for explanation. This will require IPC to get file content and selection from the editor.
    *   **Refactor Selection**: Allow users to select code and request refactoring via an AI agent.
    *   **Generate Documentation**: Integrate with an AI agent to generate documentation for code.
    *   **Find Bugs**: Use AI agents to analyze code for potential bugs.
    *   **Search Project**: Integrate with the enhanced `ProjectIntelligenceService` and `MemorySystem` to answer repository questions and search the project using natural language.
    *   **Execute Agent Workflows**: Provide an interface to trigger and monitor AI agent workflows.
2.  **Command Palette Enhancements**: Extend `CommandPalette.tsx` to support natural language commands.
    *   **Natural Language Processing (NLP)**: Integrate a local or remote NLP model to interpret natural language commands and map them to existing actions or AI agent workflows.
    *   **Integration with AI Agents**: Commands like "Explain this repository" will trigger the `ResearchAgent` or `CodingAgent` to provide summaries or find specific code.
3.  **Context Engine v2**: Significantly improve `src/engine/ContextEngine.ts` to handle a richer set of context.
    *   **Open Tabs**: Track all open tabs and their content (if accessible).
    *   **Current File & Cursor Location**: Integrate with the code editor to get the currently active file and cursor position.
    *   **Git Status**: Continuously monitor and update the Git status of the active project.
    *   **Terminal Output**: Capture and make available the output of the embedded terminal.
    *   **Clipboard**: Access and manage clipboard content.
    *   **Active Project**: Maintain a clear reference to the currently active project.
    *   **Previous Tasks**: Store and make accessible a history of previous user tasks and AI agent interactions.
    *   **Context Summarization**: Enhance the context summarization capabilities to provide more detailed and relevant context to AI agents.

## Phase J: GitHub Intelligence

**Goal**: Implement deep Git integration for enhanced code review, analysis, and repository management.

**Current State Analysis**:

*   `src/main/GitManager.ts`: Provides basic Git operations (status, commit history, commit, push, pull, branch management).

**Implementation Plan**:

1.  **Extend `GitManager.ts`**: Add new IPC handlers and logic to `GitManager.ts` for advanced Git operations.
2.  **PR Summaries**: Integrate with GitHub API (or similar Git hosting APIs) to fetch and summarize Pull Requests. This will involve:
    *   Authentication with GitHub.
    *   Fetching PR details, comments, and file changes.
    *   Using an AI agent (e.g., `ReviewerAgent`) to generate concise summaries.
3.  **Commit Summaries**: Enhance existing commit history functionality to provide AI-generated summaries of individual commits or a range of commits.
4.  **Branch Analysis**: Implement tools to analyze branches for divergence, merge conflicts, and feature completeness.
5.  **Conflict Detection**: Proactively detect potential merge conflicts and provide suggestions for resolution.
6.  **Code Review Suggestions**: Integrate the `ReviewerAgent` to provide AI-powered code review suggestions based on best practices, potential bugs, and style guides.
7.  **Repository Search**: Extend project search to include Git-specific metadata (commit messages, author, dates).
8.  **Issue Understanding**: Integrate with issue tracking systems (e.g., GitHub Issues) to understand and summarize issues.
9.  **Release Note Generation**: Automate the generation of release notes based on commit history and issue tracking.

## Phase K: Browser AI Features

**Goal**: Make browsing smarter with AI-assisted tabs, session organization, smart bookmarks, reading mode, research collections, web page summarization, cross-tab search, and intelligent downloads.

**Current State Analysis**:

*   `src/main/BrowserManager.ts`: Manages tab lifecycle.
*   `src/browser/BookmarkManager.ts`: Handles bookmarks.
*   `src/browser/HistoryManager.ts`: Manages browsing history.
*   `src/agents/BrowserAgent.ts`: Autonomous agent for web interaction and data extraction.
*   `src/agents/ResearchAgent.ts`: Specialized agent for multi-source information gathering and synthesis.

**Implementation Plan**:

1.  **AI-Assisted Tabs**: Integrate AI agents to provide context-aware suggestions for open tabs, such as related articles or tasks.
2.  **Automatic Session Organization**: Use AI to automatically group related tabs into sessions based on browsing activity and content.
3.  **Smart Bookmarks**: Enhance `BookmarkManager.ts` to include AI-generated tags, summaries, and context for bookmarks, making them more searchable and useful.
4.  **Reading Mode**: Implement an improved reading mode that uses AI to extract and present the most relevant content from a webpage, stripping away distractions.
5.  **Research Collections**: Leverage `ResearchAgent` to create and manage research collections, automatically categorizing and summarizing web pages related to a specific topic.
6.  **Web Page Summarization**: Integrate `BrowserAgent` and a text summarization AI model to provide on-demand summaries of web pages.
7.  **Cross-Tab Search**: Implement a search functionality that can search across the content of all open tabs and browsing history.
8.  **Intelligent Downloads**: Use AI to categorize and rename downloaded files, and suggest appropriate storage locations.

## Phase L: Developer Experience

**Goal**: Integrate VS Code–style command palette, embedded terminal, Git interface, Markdown preview, Diff viewer, File search, Symbol search, and Diagnostics panel.

**Current State Analysis**:

*   `src/renderer/components/CommandPalette.tsx`: Existing command palette.
*   `src/renderer/components/Terminal.tsx`: Placeholder terminal component.
*   `src/main/GitManager.ts`: Basic Git operations.
*   `src/renderer/components/DeveloperWorkspace.tsx`: Placeholder developer workspace.

**Implementation Plan**:

1.  **VS Code–style Command Palette**: Further enhance `CommandPalette.tsx` to mimic VS Code's command palette, including fuzzy searching, command history, and context-aware commands.
2.  **Embedded Terminal**: Replace the placeholder `Terminal.tsx` with a fully functional embedded terminal using `xterm.js` in the renderer and a pseudo-terminal (PTY) in the main process. This will require a new `TerminalService.ts` in the main process to manage PTYs.
3.  **Git Interface**: Develop a comprehensive Git UI within a dedicated panel (e.g., `GitPanel.tsx`) that visualizes Git status, commit history, branches, and allows for common Git operations (commit, push, pull, merge, rebase).
4.  **Markdown Preview**: Implement a real-time Markdown preview panel that renders Markdown files as HTML.
5.  **Diff Viewer**: Integrate a diff viewer component to show changes between files, Git versions, or code selections.
6.  **File Search**: Implement a robust file search functionality that can quickly find files by name or content across the entire project.
7.  **Symbol Search**: Integrate with language servers or custom parsers to provide symbol search (functions, classes, variables) within the codebase.
8.  **Diagnostics Panel**: Create a `DiagnosticsPanel.tsx` to display errors, warnings, and other diagnostic information from linters, compilers, and AI agents.

This plan provides a high-level overview of the architectural design and implementation steps for each phase. Detailed design documents for individual components and services will be created as each phase progresses.
