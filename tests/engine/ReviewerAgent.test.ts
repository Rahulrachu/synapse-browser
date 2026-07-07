
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewerAgent } from '../../src/agents/ReviewerAgent';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentContext, AgentTask } from '../../src/agents/types';

vi.mock('../../src/agents/AgentLogger');

describe('Reviewer Agent Foundation', () => {
  let messageBus: AgentMessageBus;
  let initialContext: AgentContext;
  let reviewerAgent: ReviewerAgent;

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
    reviewerAgent = new ReviewerAgent('reviewer-agent', messageBus, initialContext);
  });

  it('should have the required review capabilities', () => {
    const capabilities = reviewerAgent.getCapabilities();
    const capabilityNames = capabilities.map(c => c.name);
    
    expect(capabilityNames).toContain('code_review');
    expect(capabilityNames).toContain('quality_assurance');
    expect(capabilityNames).toContain('bug_detection');
    expect(capabilityNames).toContain('security_audit');
    expect(capabilityNames).toContain('documentation_review');
  });

  it('should route review tasks correctly', async () => {
    const task: AgentTask = {
      id: 'task-1',
      goal: 'Perform review on the new feature',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'reviewer-agent',
      context: { code: 'function test() {}' }
    };

    const result = await reviewerAgent.executeTask(task);
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('approved', true);
  });

  it('should handle security audit tasks', async () => {
    const task: AgentTask = {
      id: 'task-2',
      goal: 'Perform a security audit',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'reviewer-agent'
    };

    const result = await reviewerAgent.executeTask(task);
    expect(result.success).toBe(true);
    expect(result.output.reviewId).toContain('sec-');
  });

  it('should report completion through message bus', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-3',
      goal: 'Check documentation quality',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'reviewer-agent'
    };

    await reviewerAgent.executeTask(task);

    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'review_completed',
      payload: expect.objectContaining({ taskId: 'task-3' })
    }));
  });
});
