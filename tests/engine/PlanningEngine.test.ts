import { describe, it, expect } from 'vitest';
import PlanningEngine from '../../src/engine/PlanningEngine';

describe('PlanningEngine', () => {
  it('should create a plan', () => {
    const plan = PlanningEngine.createPlan('Build a feature', ['Task 1', 'Task 2']);
    expect(plan.goal).toBe('Build a feature');
    expect(plan.tasks.length).toBe(2);
    expect(plan.status).toBe('active');
  });

  it('should update task status', () => {
    const plan = PlanningEngine.createPlan('Test Plan', ['Task 1']);
    const taskId = plan.tasks[0].id;
    PlanningEngine.updateTaskStatus(taskId, 'completed', { success: true });
    
    const updatedPlan = PlanningEngine.getCurrentPlan();
    expect(updatedPlan?.tasks[0].status).toBe('completed');
    expect(updatedPlan?.tasks[0].result.success).toBe(true);
  });
});
