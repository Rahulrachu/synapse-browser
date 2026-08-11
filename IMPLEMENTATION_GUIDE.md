# Synapse Browser — Implementation Guide

## Quick Start

### Prerequisites
- Node.js >= 22.0.0 (current: v22.13.0 ✓)
- pnpm >= 9.0.0 (current: 11.20.0 ✓)
- Git

### Installation
```bash
cd synapse-browser
pnpm install
```

### Development
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
pnpm run dist:mac   # macOS
pnpm run dist:win   # Windows
pnpm run dist:linux # Linux
```

## Architecture Overview

### Main Process (Electron)
Located in `src/main/`:
- **background.ts** — Entry point, IPC handler registration
- **BrowserManager.ts** — Multi-tab browser control
- **AgentRuntime.ts** — AI execution engine
- **Storage.ts** — Persistence layer (JSON files)
- **ProjectManager.ts** — Workspace management
- **GitManager.ts** — Git operations
- **SessionManager.ts** — Session persistence
- **TabGroupManager.ts** — Tab organization
- **PanelManager.ts** — Layout management
- **ContextEngine.ts** — Context broker
- **AIServiceManager.ts** — AI provider management
- **preload.ts** — IPC security bridge

### Renderer Process (React)
Located in `src/renderer/`:
- **index.tsx** — Application entry point
- **components/MainLayout.tsx** — Core shell
- **components/TabBar.tsx** — Tab management UI
- **components/BrowserView.tsx** — Browser area
- **components/AIWorkspacePanel.tsx** — Agent interface
- **store/workspaceStore.ts** — Zustand state management
- **styles/index.css** — Tailwind + Liquid Glass theme

### Build Configuration
- **electron-vite.config.ts** — Vite configuration
- **package.json** — Dependencies and scripts
- **tsconfig.json** — TypeScript configuration

## Key Concepts

### IPC Communication
The preload bridge (`preload.ts`) exposes a secure API:

```typescript
// From renderer
await window.electron.invoke('create-tab', 'https://example.com');
await window.electron.invoke('get-all-tabs');

// Listen for events
window.electron.on('tabs-updated', (data) => {
  console.log('Tabs changed:', data);
});
```

### Tab Management
Tabs are managed by `BrowserManager` in the main process:
- Each tab has a unique ID
- Each tab has a `WebContentsView` for rendering
- Only the active tab's view is visible
- Tab state is broadcast to renderer on changes

### Browser Rendering
The browser content is rendered by Electron's `WebContentsView`:
- Views are attached to the main window's `contentView`
- Bounds are set based on renderer's layout calculations
- Views are shown/hidden based on active tab

### AI Agent Loop
The `AgentRuntime` implements a proper agent loop:

```
1. OBSERVE: Receive user goal
2. PLAN: Break into steps (via PlanningEngine)
3. EXECUTE: Call tools (open_page, read_page, etc.)
4. VERIFY: Check results
5. REPLAN: If needed, continue
6. COMPLETE: Return results
```

### Context System
The `ContextEngine` maintains awareness of:
- Current page (URL, title, content)
- Open tabs and groups
- Active workspace
- Files and terminal state
- Git status
- Previous agent steps

## Common Tasks

### Adding a New IPC Handler
1. Add the handler in `src/main/background.ts`:
```typescript
ipcMain.handle('my-new-handler', async (event, arg) => {
  return { result: 'success' };
});
```

2. Add the channel to the allowlist in `src/main/preload.ts`:
```typescript
const ALLOWED_INVOKE_CHANNELS = [
  // ... existing channels
  'my-new-handler'
];
```

3. Call from renderer:
```typescript
const result = await window.electron.invoke('my-new-handler', arg);
```

### Adding a New Component
1. Create in `src/renderer/components/MyComponent.tsx`
2. Import in `MainLayout.tsx` or another parent
3. Add styling using Tailwind classes and Liquid Glass theme

### Extending the Agent
1. Add new tool to `AgentRuntime.ts` in the `tools` array
2. Implement tool logic in the `tool()` method
3. Add tool name to `TOOL_NAMES` set
4. Tool will be automatically available to the agent

### Customizing the Theme
Edit `src/renderer/styles/index.css`:
```css
@theme {
  --color-glass-bg: rgba(255, 255, 255, 0.4);
  --color-glass-border: rgba(255, 255, 255, 0.2);
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

## Debugging

### Main Process
Add `console.log()` statements in `src/main/` files. Output appears in the Electron console.

### Renderer Process
Open DevTools: `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS)

### IPC Communication
Add logging in preload.ts to see all IPC calls:
```typescript
invoke: (channel: string, ...args: any[]) => {
  console.log('[IPC]', channel, args);
  // ... rest of implementation
}
```

## Performance Considerations

### Memory
- Each tab's WebContentsView consumes ~50-100MB
- Limit to ~10 tabs for reasonable memory usage
- Consider tab sleeping/hibernation for inactive tabs

### Rendering
- Liquid Glass effects use `backdrop-blur` which is GPU-accelerated
- Framer Motion animations are GPU-accelerated
- Monitor performance with DevTools profiler

### IPC
- Avoid sending large objects over IPC
- Use streaming for large file operations
- Batch updates when possible

## Security Best Practices

### Never Do This
```typescript
// ❌ Don't expose Node APIs
contextBridge.exposeInMainWorld('fs', require('fs'));

// ❌ Don't disable sandbox
webPreferences: { sandbox: false }

// ❌ Don't allow arbitrary command execution
exec(userInput)
```

### Always Do This
```typescript
// ✅ Use allowlist for IPC channels
const ALLOWED_CHANNELS = ['safe-operation'];

// ✅ Enable security features
webPreferences: {
  sandbox: true,
  contextIsolation: true,
  nodeIntegration: false,
  preload: preloadPath
}

// ✅ Validate and sanitize inputs
if (!SAFE_COMMAND.test(command)) {
  throw new Error('Command not allowed');
}
```

## Testing

### Unit Tests
```bash
pnpm run test
```

### Test UI
```bash
pnpm run test:ui
```

### Manual Testing Checklist
- [ ] Create new tab
- [ ] Close tab
- [ ] Navigate to URL
- [ ] Go back/forward
- [ ] Reload page
- [ ] AI panel opens/closes
- [ ] Agent can run tasks
- [ ] Tabs persist on reload

## Troubleshooting

### Build Fails
```bash
# Clear build artifacts
rm -rf out dist

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build
```

### IPC Channel Not Found
1. Check channel name in `preload.ts` allowlist
2. Check handler registration in `background.ts`
3. Check for typos in both places

### Tabs Not Showing
1. Verify `BrowserManager.createTab()` is called
2. Check `set-browser-area-bounds` is being called
3. Verify `WebContentsView` is added to `contentView`

### Agent Not Responding
1. Check `OPENAI_API_KEY` environment variable
2. Verify agent event listener is registered
3. Check browser console for errors

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://github.com/pmndrs/zustand)

## Contributing

When making changes:
1. Keep components focused and single-responsibility
2. Use TypeScript for type safety
3. Follow the existing code style
4. Test IPC changes thoroughly
5. Update documentation

## License

MIT
