class PlanningEngine {
  currentPlan = null;
  createPlan(goal, tasks) {
    const plan = {
      id: Date.now().toString(),
      goal,
      tasks: tasks.map((t) => ({
        id: Math.random().toString(36).substr(2, 9),
        description: t,
        status: "pending",
      })),
      status: "active",
      createdAt: Date.now(),
    };
    this.currentPlan = plan;
    return plan;
  }
  updateTaskStatus(taskId, status, result) {
    if (!this.currentPlan) return;
    const updateTask = (tasks) => {
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
  getCurrentPlan() {
    return this.currentPlan;
  }
}
export const planningEngine = new PlanningEngine();
