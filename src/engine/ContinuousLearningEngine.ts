import * as fs from 'fs';
import * as path from 'path';

export interface TaskOutcome {
  id: string;
  taskDescription: string;
  approach: string;
  success: boolean;
  executionTime: number;
  result: any;
  errors?: string[];
  timestamp: number;
}

export interface Mistake {
  id: string;
  taskId: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resolution: string;
  timestamp: number;
}

export interface PromptOptimization {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  improvementScore: number;
  successRate: number;
  timestamp: number;
}

export interface WorkflowOptimization {
  id: string;
  workflowId: string;
  originalDuration: number;
  optimizedDuration: number;
  improvements: string[];
  timestamp: number;
}

export class ContinuousLearningEngine {
  private outcomes: TaskOutcome[] = [];
  private mistakes: Mistake[] = [];
  private promptOptimizations: PromptOptimization[] = [];
  private workflowOptimizations: WorkflowOptimization[] = [];
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
    this.loadLearningData();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Stores the outcome of a task execution
   */
  storeOutcome(outcome: TaskOutcome): void {
    this.outcomes.push(outcome);
    this.saveLearningData();
  }

  /**
   * Analyzes mistakes and stores them for learning
   */
  analyzeMistake(taskId: string, error: string, resolution: string): Mistake {
    const mistake: Mistake = {
      id: `mistake-${Date.now()}`,
      taskId,
      description: error,
      category: this.categorizeError(error),
      severity: this.assessSeverity(error),
      resolution,
      timestamp: Date.now(),
    };

    this.mistakes.push(mistake);
    this.saveLearningData();

    return mistake;
  }

  private categorizeError(error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('timeout')) return 'timeout';
    if (lowerError.includes('permission')) return 'permission';
    if (lowerError.includes('not found')) return 'missing_resource';
    if (lowerError.includes('invalid')) return 'invalid_input';
    if (lowerError.includes('dependency')) return 'dependency';
    if (lowerError.includes('network')) return 'network';

    return 'unknown';
  }

  private assessSeverity(error: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('critical') || lowerError.includes('fatal')) return 'critical';
    if (lowerError.includes('error') || lowerError.includes('failed')) return 'high';
    if (lowerError.includes('warning')) return 'medium';

    return 'low';
  }

  /**
   * Optimizes prompts based on successful outcomes
   */
  optimizePrompt(originalPrompt: string, successRate: number): PromptOptimization {
    const optimizedPrompt = this.refinePrompt(originalPrompt, successRate);

    const optimization: PromptOptimization = {
      id: `opt-${Date.now()}`,
      originalPrompt,
      optimizedPrompt,
      improvementScore: Math.min(successRate * 1.2, 1.0),
      successRate,
      timestamp: Date.now(),
    };

    this.promptOptimizations.push(optimization);
    this.saveLearningData();

    return optimization;
  }

  private refinePrompt(prompt: string, successRate: number): string {
    let refined = prompt;

    // Add clarity if success rate is moderate
    if (successRate < 0.7) {
      refined = `${refined}\n\nBe specific and clear in your response.`;
    }

    // Add examples if success rate is low
    if (successRate < 0.5) {
      refined = `${refined}\n\nProvide step-by-step instructions with examples.`;
    }

    // Add verification step if success rate is moderate-high
    if (successRate > 0.7) {
      refined = `${refined}\n\nVerify your work before submitting.`;
    }

    return refined;
  }

  /**
   * Optimizes workflows based on execution history
   */
  optimizeWorkflow(workflowId: string, originalDuration: number): WorkflowOptimization {
    const improvements = this.identifyWorkflowImprovements(workflowId);
    const optimizedDuration = Math.max(originalDuration * 0.8, 1000);

    const optimization: WorkflowOptimization = {
      id: `workflow-opt-${Date.now()}`,
      workflowId,
      originalDuration,
      optimizedDuration,
      improvements,
      timestamp: Date.now(),
    };

    this.workflowOptimizations.push(optimization);
    this.saveLearningData();

    return optimization;
  }

  private identifyWorkflowImprovements(workflowId: string): string[] {
    const improvements: string[] = [];

    // Analyze outcomes for this workflow
    const relevantOutcomes = this.outcomes.filter(
      (o) => o.taskDescription.includes(workflowId)
    );

    if (relevantOutcomes.length === 0) {
      return improvements;
    }

    // Check for common slow steps
    const avgTime = relevantOutcomes.reduce((sum, o) => sum + o.executionTime, 0) / relevantOutcomes.length;

    if (avgTime > 5000) {
      improvements.push('Consider parallelizing sequential tasks');
      improvements.push('Implement caching for repeated operations');
    }

    // Check for error patterns
    const errorCount = relevantOutcomes.filter((o) => !o.success).length;
    if (errorCount > relevantOutcomes.length * 0.3) {
      improvements.push('Add error handling and retry logic');
      improvements.push('Improve input validation');
    }

    // Check for resource usage
    improvements.push('Monitor and optimize resource usage');

    return improvements;
  }

  /**
   * Ranks successful approaches
   */
  rankSuccessfulApproaches(): Array<{ approach: string; successRate: number; count: number }> {
    const approaches: Record<string, { success: number; total: number }> = {};

    this.outcomes.forEach((outcome) => {
      if (!approaches[outcome.approach]) {
        approaches[outcome.approach] = { success: 0, total: 0 };
      }

      approaches[outcome.approach].total++;
      if (outcome.success) {
        approaches[outcome.approach].success++;
      }
    });

    return Object.entries(approaches)
      .map(([approach, stats]) => ({
        approach,
        successRate: stats.total > 0 ? stats.success / stats.total : 0,
        count: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Updates memory with new insights
   */
  updateMemory(insights: Record<string, any>): void {
    const memoryPath = path.join(this.storagePath, 'memory.json');

    let memory: Record<string, any> = {};
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf-8');
      memory = JSON.parse(content);
    }

    // Merge new insights
    memory = { ...memory, ...insights, lastUpdated: Date.now() };

    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  }

  /**
   * Generates learning report
   */
  generateLearningReport(): Record<string, any> {
    const totalOutcomes = this.outcomes.length;
    const successfulOutcomes = this.outcomes.filter((o) => o.success).length;
    const successRate = totalOutcomes > 0 ? successfulOutcomes / totalOutcomes : 0;

    const avgExecutionTime =
      totalOutcomes > 0
        ? this.outcomes.reduce((sum, o) => sum + o.executionTime, 0) / totalOutcomes
        : 0;

    const mistakesByCategory: Record<string, number> = {};
    this.mistakes.forEach((mistake) => {
      mistakesByCategory[mistake.category] = (mistakesByCategory[mistake.category] || 0) + 1;
    });

    const topApproaches = this.rankSuccessfulApproaches().slice(0, 5);

    return {
      summary: {
        totalOutcomes,
        successfulOutcomes,
        successRate: (successRate * 100).toFixed(2) + '%',
        avgExecutionTime: avgExecutionTime.toFixed(2) + 'ms',
      },
      mistakes: {
        total: this.mistakes.length,
        byCategory: mistakesByCategory,
        criticalCount: this.mistakes.filter((m) => m.severity === 'critical').length,
      },
      optimizations: {
        promptOptimizations: this.promptOptimizations.length,
        workflowOptimizations: this.workflowOptimizations.length,
      },
      topApproaches,
      timestamp: Date.now(),
    };
  }

  /**
   * Gets learning insights
   */
  getLearningInsights(): Record<string, any> {
    const report = this.generateLearningReport();

    return {
      report,
      recommendations: this.generateRecommendations(report),
      nextSteps: this.generateNextSteps(report),
    };
  }

  private generateRecommendations(report: Record<string, any>): string[] {
    const recommendations: string[] = [];

    if (report.summary.successRate < '70%') {
      recommendations.push('Focus on improving success rate through better error handling');
    }

    if (report.mistakes.criticalCount > 0) {
      recommendations.push('Address critical mistakes immediately');
    }

    if (report.optimizations.promptOptimizations < 3) {
      recommendations.push('Invest in prompt optimization for better results');
    }

    return recommendations;
  }

  private generateNextSteps(report: Record<string, any>): string[] {
    return [
      'Continue collecting outcomes and mistakes',
      'Implement top-ranked approaches in new tasks',
      'Review and refine prompts based on success rates',
      'Optimize workflows based on execution times',
    ];
  }

  /**
   * Saves learning data to storage
   */
  private saveLearningData(): void {
    const dataPath = path.join(this.storagePath, 'learning-data.json');

    const data = {
      outcomes: this.outcomes,
      mistakes: this.mistakes,
      promptOptimizations: this.promptOptimizations,
      workflowOptimizations: this.workflowOptimizations,
      lastUpdated: Date.now(),
    };

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }

  /**
   * Loads learning data from storage
   */
  private loadLearningData(): void {
    const dataPath = path.join(this.storagePath, 'learning-data.json');

    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(content);

      this.outcomes = data.outcomes || [];
      this.mistakes = data.mistakes || [];
      this.promptOptimizations = data.promptOptimizations || [];
      this.workflowOptimizations = data.workflowOptimizations || [];
    }
  }

  /**
   * Gets all outcomes
   */
  getOutcomes(limit: number = 100): TaskOutcome[] {
    return this.outcomes.slice(-limit);
  }

  /**
   * Gets all mistakes
   */
  getMistakes(limit: number = 100): Mistake[] {
    return this.mistakes.slice(-limit);
  }
}
