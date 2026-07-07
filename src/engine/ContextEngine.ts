import { ContextEngineV2 } from './ContextEngineV2';

// Re-export ContextEngineV2 as the default ContextEngine to maintain backward compatibility
// while providing the enhanced functionality.

const contextEngine = ContextEngineV2.getInstance();

export default contextEngine;
export { ContextState } from './ContextEngineV2';
