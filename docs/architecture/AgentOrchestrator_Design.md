# AI Agent Orchestrator Design

## Overview

The `AgentOrchestrator` is a pivotal high-level service designed to manage the lifecycle, delegation, and monitoring of AI agents within the Synapse Browser. This service extends the existing functionalities of `AgentRuntime` and `AgentManager` by introducing advanced orchestration capabilities, ensuring a more robust and efficient agent ecosystem.

## Core Components

### 1. AgentOrchestrator Service

The `AgentOrchestrator` service, located at `src/agents/AgentOrchestrator.ts`, is responsible for several critical functions. It provides comprehensive **lifecycle management** for agents and their tasks, encompassing the ability to create, pause, resume, cancel, and retry agent tasks. Furthermore, it incorporates **enhanced delegation logic**, allowing agents to effectively request and receive assistance from other specialized agents. For seamless operation, the orchestrator integrates with various core systems, including the `TaskQueueManager`, `WorkflowEngine`, `SkillRegistry`, `MemoryManager`, and `SearchEngine`. To ensure continuity and traceability, it also handles **persistence** by saving execution history and resource usage data to SQLite, leveraging the `TaskQueueManager` for this purpose.

### 2. Enhanced Agent Roles

The orchestrator supports a diverse set of specialized agent roles, each with distinct responsibilities, to facilitate complex task execution. These roles are designed to promote modularity and efficiency in handling various aspects of a user's goal:

| Agent Role    | Description                                            |
| :------------ | :----------------------------------------------------- |
| **Planner**   | Responsible for hierarchical task decomposition, breaking down complex goals into manageable subtasks. |
| **Researcher**| Focuses on multi-source information gathering and synthesis. |
| **Coder**     | Handles code generation, modification, and debugging tasks. |
| **Reviewer**  | Ensures quality assurance and performs security audits on code and content. |
| **Executor**  | Executes specialized browser and system actions.         |
| **Writer**    | Manages content generation, summarization, and documentation. |

### 3. Agent Monitor UI

A dedicated **Agent Monitor panel** will be introduced in the renderer process to provide users with real-time insights into the orchestration process. This panel will display active agents, their current tasks, and progress updates. It will also visualize resource usage and an interactive execution timeline, alongside historical execution records, offering a comprehensive overview of agent activities.

## Integration Plan

### Task Queue & Persistence

Integration with the `TaskQueueManager` is crucial for managing agent tasks. Each `AgentTask` will be mapped to a `Job` within the `TaskQueueManager`. To ensure tasks survive application restarts, `isPersistent` will be set to `true` for all agent tasks. Agent-specific metadata, such as agent ID, task type, and context, will be stored within the `metadata` JSON field of the `Job` entry.

### Event Bus

The `Event Bus` will be utilized to publish key orchestration events, including `agent:task-started`, `agent:task-completed`, and `agent:delegation-requested`. These events will be subscribed to by the `AgentMonitor` panel to provide live updates to the user interface, ensuring transparency and real-time feedback on agent operations.

### Permission System

To maintain security and user control, the `Permission System` will be integrated to check permissions before agents execute sensitive actions, such as file writing or network access. For actions requiring explicit user consent, the `PermissionManager.requestPermission` API will be used to prompt for user-in-the-loop approvals.

### AI Model Provider Framework

The `AgentOrchestrator` will interact with the `AI Model Provider Framework` through the `AIServiceManager`. This integration will allow agents to retrieve available AI models and their configurations. Agents will be configured to use the user-selected default model if no specific model is designated for a task, ensuring flexibility and adherence to user preferences.

## API Changes

### New IPC Handlers

To support the new orchestration capabilities, several new Inter-Process Communication (IPC) handlers will be introduced:

| IPC Handler           | Description                                            |
| :-------------------- | :----------------------------------------------------- |
| `agent:orchestrate-goal`| Submits a high-level goal to the `AgentOrchestrator` for decomposition and execution. |
| `agent:pause-task`    | Pauses an ongoing agent task.                          |
| `agent:resume-task`   | Resumes a previously paused agent task.                |
| `agent:cancel-task`   | Cancels an active or pending agent task.               |
| `agent:retry-task`    | Retries a failed agent task.                           |
| `agent:get-history`   | Retrieves the persisted execution history of agent tasks. |

## References

No external references are cited in this document.
