
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchAgent } from '../../src/agents/ResearchAgent';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentContext, AgentTask } from '../../src/agents/types';

// Mock MemorySystem
vi.mock('../../src/engine/MemorySystem', () => ({
  default: { addMemory: vi.fn() }
}));

vi.mock('../../src/agents/AgentLogger');

describe('Research Agent', () => {
  let messageBus: AgentMessageBus;
  let initialContext: AgentContext;
  let researchAgent: ResearchAgent;

  beforeEach(() => {
    messageBus = new AgentMessageBus();
    initialContext = {
      sharedData: new Map(),
      contextEngineState: {} as any,
      memorySystemState: [],
      planningEngineState: null,
      browserAutomationState: {},
      toolRuntimeState: []
    };
    researchAgent = new ResearchAgent('research-agent', messageBus, initialContext);
  });

  it('should coordinate with Browser Agent for research tasks', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-1',
      goal: 'Research about AI agents',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'research-agent',
      context: { urls: ['https://en.wikipedia.org/wiki/Software_agent'] }
    };

    const result = await researchAgent.executeTask(task);
    expect(result.success).toBe(true);
    
    // Check if it published a task for the Browser Agent
    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'browser-agent',
      type: 'task_assigned'
    }));
  });

  it('should handle content from Browser Agent and detect duplicates', async () => {
    const url = 'https://example.com';
    const content = 'Example research content';
    
    // Simulate receiving content
    await (researchAgent as any).handleBrowserContent(url, content);
    
    const findings = (researchAgent as any).findings.get('current');
    expect(findings).toHaveLength(1);
    expect(findings[0].source).toBe(url);
    expect(findings[0].content).toBe(content);
  });

  it('should summarize findings into structured JSON', async () => {
    const topic = 'Quantum Computing';
    const urls = ['https://source1.com', 'https://source2.com'];
    
    const summary = (researchAgent as any).generateSummary(topic, urls);
    
    expect(summary.topic).toBe(topic);
    expect(summary.sources).toEqual(urls);
    expect(summary).toHaveProperty('summary');
    expect(summary).toHaveProperty('findings');
  });

  it('should report completion through message bus', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-2',
      goal: 'Research on climate change',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'research-agent',
      context: { urls: ['https://climate.nasa.gov/'] }
    };

    await researchAgent.executeTask(task);

    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'research_completed',
      payload: expect.objectContaining({ topic: 'climate change' })
    }));
  });
});
