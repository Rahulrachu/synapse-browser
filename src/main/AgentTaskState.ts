export type TaskPhase = 'observe' | 'understand' | 'plan' | 'act' | 'verify' | 'recover' | 'confirm' | 'complete' | 'failed' | 'cancelled';

export type TaskProvenance = {
  key: string;
  value: string;
  sourceUrl: string;
  sourceTitle?: string;
  observedAt: number;
};

export type TaskActionRecord = {
  name: string;
  origin: string;
  expected: string;
  actual?: string;
  status: 'started' | 'verified' | 'failed' | 'recovered' | 'cancelled';
  attempts: number;
  at: number;
};

export type AgentTaskState = {
  runId: string;
  goal: string;
  phase: TaskPhase;
  currentSubgoal: string;
  currentOrigin: string;
  origins: string[];
  approvedOrigins: string[];
  requestedOrigins: string[];
  observation?: { url: string; title: string; text: string; at: number };
  expectedResult?: string;
  actualResult?: string;
  confidence: number;
  recoveryAttempts: number;
  remainingSteps: number;
  deadlineAt: number;
  cancelled: boolean;
  memory: Record<string, string>;
  provenance: TaskProvenance[];
  actions: TaskActionRecord[];
};

export function originOf(url: string): string {
  try { return new URL(url).origin; } catch { return ''; }
}

export function requestedOrigins(goal: string): string[] {
  const origins = new Set<string>();
  for (const match of goal.matchAll(/https?:\/\/[^\s)]+/gi)) {
    const origin = originOf(match[0].replace(/[.,;]+$/, ''));
    if (origin) origins.add(origin);
  }
  return [...origins];
}

export function createTaskState(runId: string, goal: string, maxSteps: number, timeoutMs: number): AgentTaskState {
  return {
    runId, goal, phase: 'understand', currentSubgoal: 'Understand the user goal', currentOrigin: '',
    origins: [], approvedOrigins: requestedOrigins(goal), requestedOrigins: requestedOrigins(goal),
    confidence: 0, recoveryAttempts: 0, remainingSteps: maxSteps, deadlineAt: Date.now() + timeoutMs,
    cancelled: false, memory: {}, provenance: [], actions: [],
  };
}

export function isPromptInjection(text: string): boolean {
  return /(?:ignore|disregard|forget)\s+(?:(?:all|any|the|your|my|previous)\s+){0,3}(?:instructions|rules)|system\s+message|developer\s+message|reveal\s+(?:your|the)\s+(?:prompt|secrets?)|send\s+(?:password|cookie|token|credential)/i.test(text);
}

export function webContentForModel(text: string): string {
  const clipped = String(text || '').slice(0, 16000);
  return `[UNTRUSTED_WEB_CONTENT]\n${clipped}\n[/UNTRUSTED_WEB_CONTENT]`;
}

export function isOriginApproved(state: AgentTaskState, origin: string): boolean {
  return !origin || state.approvedOrigins.includes(origin) || state.requestedOrigins.includes(origin);
}

export function addOrigin(state: AgentTaskState, origin: string): void {
  if (!origin) return;
  if (!state.origins.includes(origin)) state.origins.push(origin);
  state.currentOrigin = origin;
}

export function recordAction(state: AgentTaskState, action: Omit<TaskActionRecord, 'at'>): void {
  const matchingStarted = [...state.actions].reverse().findIndex((entry) => entry.status === 'started' && entry.name === action.name && entry.origin === action.origin);
  if (matchingStarted >= 0 && action.status !== 'started') {
    const index = state.actions.length - 1 - matchingStarted;
    state.actions[index] = { ...state.actions[index], ...action, at: Date.now() };
  } else {
    state.actions.push({ ...action, at: Date.now() });
  }
  if (state.actions.length > 100) state.actions.shift();
}

export function deadlineExceeded(state: AgentTaskState): boolean {
  return Date.now() >= state.deadlineAt;
}
