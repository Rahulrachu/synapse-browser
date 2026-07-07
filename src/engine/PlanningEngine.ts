export interface PlanTask {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  subtasks?: PlanTask[];
  result?: any;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: PlanTask[];
  status: 'active' | 'completed' | 'aborted';
  createdAt: number;
}

class PlanningEngine {
  private currentPlan: Plan | null = null;

  createPlan(goal: string, tasks: string[]): Plan {
    const plan: Plan = {
      id: Date.now().toString(),
      goal,
      tasks: tasks.map(t => ({
        id: Math.random().toString(36).substr(2, 9),
        description: t,
        status: 'pending'
      })),
      status: 'active',
      createdAt: Date.now(),
    };
    this.currentPlan = plan;
    return plan;
  }

  updateTaskStatus(taskId: string, status: PlanTask['status'], result?: any) {
    if (!this.currentPlan) return;
    
    const updateTask = (tasks: PlanTask[]) => {
      for (const task of tasks) {
        if (task.id === taskId) {
          task.status = status;
          if (result) task.result = result;
          return true;
        }
        if (task.subtasks && updateTask(task.subtasks)) return true;
      }
      return false;
    };

    updateTask(this.currentPlan.tasks);
  }

  getCurrentPlan(): Plan | null {
    return this.currentPlan;
  }
}

export default new PlanningEngine();
