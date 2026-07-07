
import { AgentId, AgentName, AgentCapability } from './types';
import { BaseAgent } from './BaseAgent';

export class AgentRegistry {
  private agents: Map<AgentId, BaseAgent> = new Map();

  registerAgent(agent: BaseAgent) {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} already registered.`);
    }
    this.agents.set(agent.id, agent);
    console.log(`Agent registered: ${agent.name} (${agent.id})`);
  }

  getAgent(id: AgentId): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentCapabilities(id: AgentId): AgentCapability[] | undefined {
    return this.agents.get(id)?.getCapabilities();
  }

  unregisterAgent(id: AgentId) {
    if (!this.agents.has(id)) {
      throw new Error(`Agent with ID ${id} not found.`);
    }
    this.agents.delete(id);
    console.log(`Agent unregistered: ${id}`);
  }
}
