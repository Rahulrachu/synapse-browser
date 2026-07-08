# AI Model Provider Framework Design

## Overview

The `AIModelProviderFramework` is a modular and extensible system designed to manage various AI model providers (e.g., OpenAI, Anthropic, Gemini, Ollama) within the Synapse Browser. It provides a unified abstraction layer for interacting with different AI models, handling streaming responses, token tracking, and health monitoring.

## Core Components

### 1. Provider Abstraction Layer

The framework defines a base `AIProvider` class and an `IAIProvider` interface that all specific providers must implement. This abstraction ensures that the rest of the application can interact with AI models in a provider-agnostic manner.

| Interface/Class | Description |
| :--- | :--- |
| `IAIProvider` | Defines the standard methods for a provider, including `chat`, `streamChat`, `getModels`, and `checkHealth`. |
| `BaseAIProvider` | Provides common functionality for all providers, such as configuration management and error handling. |

### 2. Specific Providers

The framework includes several built-in providers, each tailored to a specific AI service:

| Provider | Description |
| :--- | :--- |
| **OpenAI** | Integrates with OpenAI's GPT-4 and GPT-3.5 models. |
| **Anthropic** | Integrates with Anthropic's Claude 3 family of models. |
| **Google Gemini** | Integrates with Google's Gemini Pro and Ultra models. |
| **Local Ollama** | Enables interaction with locally hosted models via Ollama. |

### 3. AIModelProviderManager

The `AIModelProviderManager` is the central service that manages the lifecycle and selection of providers. It handles:
- **Provider Registration**: Allows new providers to be registered dynamically.
- **Model Selection**: Provides an API for selecting the active model and provider.
- **API Key Management**: Securely stores and retrieves API keys for each provider.
- **Token & Cost Tracking**: Monitors token usage and calculates estimated costs per request and provider.
- **Health Monitoring**: Periodically checks the status of registered providers.

## Integration Plan

### Agent Orchestrator

The `Agent Orchestrator` will use the `AIModelProviderManager` to assign specific models to different agent roles (e.g., GPT-4 for Planning, Claude 3 for Writing). This ensures that each agent has the most suitable model for its specialized tasks.

### AI Skill Registry

The `AI Skill Registry` will leverage the framework to provide AI-powered skills. Each skill can specify its preferred model or use the system default.

### Memory & Knowledge Engine

The `Memory Engine` will use the framework for generating embeddings and performing semantic search, ensuring high-quality information retrieval.

### Workflow Engine

The `Workflow Engine` can incorporate AI-driven steps into workflows, using the unified provider API to execute complex tasks.

## UI Components

### 1. Model Selection UI

A dedicated interface in the Settings panel will allow users to:
- Select their preferred default provider and model.
- Configure provider-specific settings (e.g., temperature, max tokens).
- View real-time health status of each provider.

### 2. API Key Management

A secure UI for entering and managing API keys for various services. Keys are stored locally and encrypted if possible.

### 3. Usage Dashboard

A visual dashboard showing token usage trends and estimated costs, helping users manage their AI consumption.

## API Changes

### New IPC Handlers

| IPC Handler | Description |
| :--- | :--- |
| `ai:get-providers` | Returns a list of all registered providers and their status. |
| `ai:get-models` | Returns a list of available models for a given provider. |
| `ai:set-config` | Updates the configuration (including API keys) for a provider. |
| `ai:chat` | Executes a non-streaming chat request. |
| `ai:stream-chat` | Initiates a streaming chat request. |
| `ai:get-usage` | Retrieves token usage and cost statistics. |
