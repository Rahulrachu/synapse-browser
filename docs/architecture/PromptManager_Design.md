# AI Prompt Library & Prompt Manager Design

## Overview

The `PromptManager` is a centralized service designed to manage AI prompts, templates, and collections within the Synapse Browser. It provides a structured way to store, organize, and retrieve prompts for various AI-driven tasks, ensuring consistency and reusability across the application.

## Core Components

### 1. PromptManager Service

The `PromptManager` handles the core logic for prompt management, including:
- **Persistence**: Storing prompts locally on the file system.
- **Organization**: Categorizing prompts by type (System, User, Template) and tags.
- **Search & Filter**: Providing efficient ways to find prompts.
- **Import/Export**: Supporting JSON-based import and export for prompt sharing.

### 2. Prompt Data Model

Prompts are represented by a structured data model:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the prompt. |
| `title` | `string` | User-friendly title. |
| `content` | `string` | The actual prompt text or template. |
| `type` | `string` | `system`, `user`, or `template`. |
| `category` | `string` | e.g., `Coding`, `Writing`, `Research`. |
| `tags` | `string[]` | List of tags for organization. |
| `isFavorite` | `boolean` | Flag for favorited prompts. |
| `isBuiltIn` | `boolean` | Flag for pre-installed prompts. |
| `variables` | `string[]` | List of placeholders for template prompts (e.g., `{{code}}`). |

### 3. Built-in Collections

The framework includes pre-defined prompt collections for common use cases:
- **Coding**: Refactoring, optimization, documentation.
- **Debugging**: Error analysis, stack trace explanation.
- **Code Review**: Style check, security audit, logic verification.
- **Writing**: Summarization, expansion, tone adjustment.
- **Research**: Information extraction, fact-checking, synthesis.
- **Planning**: Task decomposition, timeline estimation.

## Integration Plan

### AI Model Provider Framework

The `PromptManager` will provide prompts to the `AIModelProviderFramework` for execution. Users can select a prompt from the library and apply it to a specific model.

### Agent Orchestrator

The `Agent Orchestrator` can use system prompts from the library to define the behavior and constraints of different agent roles.

### AI Skill Registry

Skills can reference prompts from the library as part of their execution logic, allowing for easy updates to skill behavior without modifying code.

### Memory & Knowledge Engine

The `Memory Engine` can use specific prompts for summarizing memories or extracting key information from stored knowledge.

### Workflow Engine

Workflows can include steps that utilize prompts from the library, enabling complex AI-driven processes.

## UI Components

### 1. Prompt Library Panel

A dedicated UI panel for managing the prompt library:
- **Search Bar**: Real-time search by title, content, or tags.
- **Category Filter**: Sidebar or dropdown to filter by category.
- **Prompt List**: Scrollable list of prompts with quick actions (Copy, Favorite).
- **Prompt Editor**: Interface for creating and editing prompts, including variable highlighting.

### 2. Import/Export Interface

Tools for backing up the library or importing shared prompt collections.

## API Changes

### New IPC Handlers

| IPC Handler | Description |
| :--- | :--- |
| `prompts:get-all` | Returns all prompts in the library. |
| `prompts:get-by-id` | Returns a specific prompt by ID. |
| `prompts:save` | Saves or updates a prompt. |
| `prompts:delete` | Deletes a prompt. |
| `prompts:toggle-favorite` | Toggles the favorite status of a prompt. |
| `prompts:import` | Imports prompts from a JSON object. |
| `prompts:export` | Exports selected prompts to a JSON object. |
