import { ContextEngineV2, type ContextState } from './ContextEngineV2.js';

// Re-export ContextEngineV2 as the default ContextEngine to maintain backward compatibility
// while providing the enhanced functionality.

const contextEngine = ContextEngineV2.getInstance();

export default contextEngine;
export type { ContextState };
