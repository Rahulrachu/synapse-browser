import { EventEmitter } from 'events';

export interface Goal {
  id: string;
  description: string;
  priority: number;
  constraints: string[];
  context: Record<string, any>;
}

export interface Plan {
  id: string;
  goalId: string;
  steps: PlanStep[];
  estimatedDuration: number;
  confidence: number;
  alternatives: Plan[];
}

export interface PlanStep {
  id: string;
  action: string;
  description: string;
  expectedOutcome: string;
  dependencies: string[];
  estimatedDuration: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output: any;
  executionTime: number;
  errors?: string[];
}

export interface ReflectionReport {
  taskId: string;
  timestamp: number;
  success: boolean;
  analysis: string;
  improvements: string[];
  confidenceAdjustment: number;
}

export class CognitiveEngine extends EventEmitter {
  private goals: Map<string, Goal> = new Map();
  private plans: Map<string, Plan> = new Map();
  private reflectionHistory: ReflectionReport[] = [];
  private confidenceScores: Map<string, number> = new Map();

  constructor() {
    super();
  }

  /**
   * Decomposes a high-level goal into actionable sub-tasks
   */
  async decomposeGoal(goal: Goal): Promise<Plan> {
    this.emit('decomposition-start', { goal });

    const plan: Plan = {
      id: `plan-${Date.now()}`,
      goalId: goal.id,
      steps: [],
      estimatedDuration: 0,
      confidence: 0.8,
      alternatives: [],
    };

    // Analyze goal and generate steps
    const steps = await this.generatePlanSteps(goal);
    plan.steps = steps;
    plan.estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);

    // Generate alternative plans
    plan.alternatives = await this.generateAlternativePlans(goal, plan);

    this.plans.set(plan.id, plan);
    this.emit('decomposition-complete', { goal, plan });

    return plan;
  }

  private async generatePlanSteps(goal: Goal): Promise<PlanStep[]> {
    const steps: PlanStep[] = [];

    // Parse goal description to identify key actions
    const actions = this.extractActions(goal.description);

    actions.forEach((action, index) => {
      steps.push({
        id: `step-${index}`,
        action,
        description: `Execute: ${action}`,
        expectedOutcome: `Completed: ${action}`,
        dependencies: index > 0 ? [`step-${index - 1}`] : [],
        estimatedDuration: 300, // 5 minutes default
      });
    });

    return steps;
  }

  /**
   * Extracts actionable keywords from a goal description using natural language heuristics.
   */
  private extractActions(description: string): string[] {
    const actionKeywords = [
      'create', 'build', 'implement', 'develop', 
      'test', 'verify', 'validate', 'check',
      'deploy', 'release', 'publish',
      'review', 'audit', 'analyze',
      'document', 'write', 'summarize',
      'refactor', 'optimize', 'improve', 'fix', 'clean'
    ];
    
    const words = description.toLowerCase().split(/\W+/);
    const actions = actionKeywords.filter(keyword => words.includes(keyword));

    // Map keywords to standard action names
    const mappedActions = actions.map(action => {
      if (['create', 'build', 'implement', 'develop'].includes(action)) return 'Development';
      if (['test', 'verify', 'validate', 'check'].includes(action)) return 'Testing';
      if (['deploy', 'release', 'publish'].includes(action)) return 'Deployment';
      if (['review', 'audit', 'analyze'].includes(action)) return 'Analysis';
      if (['document', 'write', 'summarize'].includes(action)) return 'Documentation';
      if (['refactor', 'optimize', 'improve', 'fix', 'clean'].includes(action)) return 'Optimization';
      return action.charAt(0).toUpperCase() + action.slice(1);
    });

    // Remove duplicates and ensure at least one action
    const uniqueActions = [...new Set(mappedActions)];
    return uniqueActions.length > 0 ? uniqueActions : ['Execution'];
  }

  private async generateAlternativePlans(goal: Goal, mainPlan: Plan): Promise<Plan[]> {
    // Generate 2-3 alternative approaches
    const alternatives: Plan[] = [];

    for (let i = 0; i < 2; i++) {
      const altPlan: Plan = {
        id: `plan-alt-${i}`,
        goalId: goal.id,
        steps: this.shuffleSteps(mainPlan.steps),
        estimatedDuration: mainPlan.estimatedDuration * (0.8 + Math.random() * 0.4),
        confidence: 0.6 + Math.random() * 0.2,
        alternatives: [],
      };

      alternatives.push(altPlan);
    }

    return alternatives;
  }

  private shuffleSteps(steps: PlanStep[]): PlanStep[] {
    return [...steps].sort(() => Math.random() - 0.5);
  }

  /**
   * Analyzes task results and performs self-reflection
   */
  async reflectOnResult(taskId: string, result: TaskResult): Promise<ReflectionReport> {
    this.emit('reflection-start', { taskId, result });

    const report: ReflectionReport = {
      taskId,
      timestamp: Date.now(),
      success: result.success,
      analysis: '',
      improvements: [],
      confidenceAdjustment: 0,
    };

    if (result.success) {
      report.analysis = `Task ${taskId} completed successfully in ${result.executionTime}ms`;
      report.improvements = this.identifyOptimizations(result);
      report.confidenceAdjustment = 0.05; // Increase confidence
    } else {
      report.analysis = `Task ${taskId} failed with errors: ${result.errors?.join(', ')}`;
      report.improvements = this.suggestRecoveryStrategies(result);
      report.confidenceAdjustment = -0.1; // Decrease confidence
    }

    // Update confidence score
    const currentConfidence = this.confidenceScores.get(taskId) || 0.5;
    this.confidenceScores.set(
      taskId,
      Math.max(0, Math.min(1, currentConfidence + report.confidenceAdjustment))
    );

    this.reflectionHistory.push(report);
    this.emit('reflection-complete', report);

    return report;
  }

  private identifyOptimizations(result: TaskResult): string[] {
    const improvements: string[] = [];

    if (result.executionTime > 5000) {
      improvements.push('Consider parallelizing sub-tasks for better performance');
    }

    improvements.push('Document this successful approach for future reference');

    return improvements;
  }

  private suggestRecoveryStrategies(result: TaskResult): string[] {
    const strategies: string[] = [];

    if (result.errors) {
      result.errors.forEach((error) => {
        if (error.includes('timeout')) {
          strategies.push('Increase timeout threshold or break task into smaller steps');
        } else if (error.includes('dependency')) {
          strategies.push('Verify all dependencies are available and correctly configured');
        } else if (error.includes('permission')) {
          strategies.push('Check access permissions and authentication credentials');
        }
      });
    }

    return strategies;
  }

  /**
   * Revises plan based on failures or new information
   */
  async revisePlan(planId: string, feedback: Record<string, any>): Promise<Plan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    this.emit('plan-revision-start', { planId, feedback });

    const revisedPlan: Plan = {
      ...plan,
      id: `plan-revised-${Date.now()}`,
      steps: [],
    };

    // Adjust steps based on feedback
    if (feedback.failedSteps) {
      revisedPlan.steps = plan.steps.map((step) => {
        if (feedback.failedSteps.includes(step.id)) {
          return {
            ...step,
            estimatedDuration: step.estimatedDuration * 1.5,
            description: `${step.description} (with additional error handling)`,
          };
        }
        return step;
      });
    }

    // Reduce confidence if plan is being revised
    revisedPlan.confidence = Math.max(0.3, plan.confidence - 0.15);

    this.plans.set(revisedPlan.id, revisedPlan);
    this.emit('plan-revision-complete', { originalPlan: plan, revisedPlan });

    return revisedPlan;
  }

  /**
   * Scores confidence for a given task or plan
   */
  getConfidenceScore(taskId: string): number {
    return this.confidenceScores.get(taskId) || 0.5;
  }

  /**
   * Verifies the result of a task
   */
  async verifyResult(result: TaskResult): Promise<{ verified: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!result.success) {
      issues.push('Task execution failed');
    }

    if (result.executionTime < 0) {
      issues.push('Invalid execution time');
    }

    if (!result.output) {
      issues.push('No output produced');
    }

    return {
      verified: issues.length === 0,
      issues,
    };
  }

  /**
   * Prioritizes tasks based on importance and dependencies
   */
  prioritizeTasks(tasks: PlanStep[]): PlanStep[] {
    return tasks.sort((a, b) => {
      // Tasks with no dependencies should be prioritized
      const aDepCount = a.dependencies.length;
      const bDepCount = b.dependencies.length;

      if (aDepCount !== bDepCount) {
        return aDepCount - bDepCount;
      }

      // Then by estimated duration (shorter tasks first)
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  /**
   * Consolidates memory by integrating new insights
   */
  consolidateMemory(insights: Record<string, any>): void {
    this.emit('memory-consolidation', { insights });

    // In a real implementation, this would update a knowledge base
    // For now, we'll just emit the event
  }

  getReflectionHistory(limit: number = 10): ReflectionReport[] {
    return this.reflectionHistory.slice(-limit);
  }

  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  listPlans(goalId?: string): Plan[] {
    const plans = Array.from(this.plans.values());
    return goalId ? plans.filter((p) => p.goalId === goalId) : plans;
  }
}
