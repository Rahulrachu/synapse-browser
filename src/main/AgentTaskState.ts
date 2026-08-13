import { createHash } from 'node:crypto';

export type TaskPhase = 'observe' | 'understand' | 'plan' | 'act' | 'verify' | 'recover' | 'confirm' | 'complete' | 'failed' | 'cancelled';
export type AgentTaskStatus = 'IDLE' | 'PLANNING' | 'OBSERVING' | 'ACTING' | 'VERIFYING' | 'RECOVERING' | 'WAITING_FOR_USER' | 'WAITING_FOR_PERMISSION' | 'WAITING_FOR_AUTH' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BLOCKED';
export type ActionRisk = 'low' | 'medium' | 'high' | 'critical';

export type TaskProvenance = {
  key: string;
  value: string;
  sourceUrl: string;
  sourceTitle?: string;
  observedAt: number;
  sourceStateHash?: string;
  destinationOrigin?: string;
  transformation?: string;
};

export type TaskActionRecord = {
  id?: string;
  name: string;
  origin: string;
  targetOrigin?: string;
  expected: string;
  actual?: string;
  status: 'started' | 'verified' | 'failed' | 'recovered' | 'cancelled';
  attempts: number;
  at: number;
  risk?: ActionRisk;
  idempotencyKey?: string;
  stateHashBefore?: string;
  stateHashAfter?: string;
};

export type PendingApproval = {
  actionId: string;
  name: string;
  origin: string;
  targetOrigin?: string;
  normalizedArgs: string;
  what: string;
  where: string;
  data?: string;
  recipient?: string;
  expiresAt: number;
};

export type AgentTaskState = {
  runId: string;
  goal: string;
  status: AgentTaskStatus;
  phase: TaskPhase;
  currentSubgoal: string;
  currentOrigin: string;
  origins: string[];
  approvedOrigins: string[];
  requestedOrigins: string[];
  readableOrigins: string[];
  writableOrigins: string[];
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
  stateHash?: string;
  progressHashes: string[];
  completedMilestones: string[];
  pendingApproval?: PendingApproval;
  blockedReason?: string;
};

const TRANSITIONS: Record<AgentTaskStatus, AgentTaskStatus[]> = {
  IDLE: ['PLANNING', 'CANCELLED'],
  PLANNING: ['OBSERVING', 'ACTING', 'VERIFYING', 'COMPLETED', 'WAITING_FOR_PERMISSION', 'WAITING_FOR_AUTH', 'PAUSED', 'FAILED', 'CANCELLED'],
  OBSERVING: ['PLANNING', 'ACTING', 'VERIFYING', 'WAITING_FOR_PERMISSION', 'WAITING_FOR_AUTH', 'PAUSED', 'FAILED', 'CANCELLED'],
  ACTING: ['VERIFYING', 'WAITING_FOR_USER', 'WAITING_FOR_PERMISSION', 'WAITING_FOR_AUTH', 'RECOVERING', 'FAILED', 'CANCELLED'],
  VERIFYING: ['PLANNING', 'RECOVERING', 'COMPLETED', 'WAITING_FOR_USER', 'FAILED', 'CANCELLED'],
  RECOVERING: ['OBSERVING', 'PLANNING', 'ACTING', 'PAUSED', 'FAILED', 'CANCELLED'],
  WAITING_FOR_USER: ['ACTING', 'PLANNING', 'PAUSED', 'FAILED', 'CANCELLED'],
  WAITING_FOR_PERMISSION: ['ACTING', 'PLANNING', 'PAUSED', 'FAILED', 'CANCELLED'],
  WAITING_FOR_AUTH: ['OBSERVING', 'PLANNING', 'PAUSED', 'FAILED', 'CANCELLED'],
  PAUSED: ['PLANNING', 'OBSERVING', 'ACTING', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  BLOCKED: ['WAITING_FOR_USER', 'PLANNING', 'CANCELLED', 'FAILED'],
};

export function canTransition(from: AgentTaskStatus, to: AgentTaskStatus): boolean { return from === to || TRANSITIONS[from]?.includes(to) === true; }

export function transitionTaskState(state: AgentTaskState, next: AgentTaskStatus, reason?: string): void {
  if (!canTransition(state.status, next)) throw new Error(`Illegal agent state transition: ${state.status} -> ${next}`);
  state.status = next;
  if (next === 'BLOCKED' || next === 'FAILED') state.blockedReason = reason;
}

export function assertActionAllowed(state: AgentTaskState): void {
  if (state.cancelled || state.status === 'CANCELLED') throw new Error('Agent run cancelled');
  if (['WAITING_FOR_USER', 'WAITING_FOR_PERMISSION', 'WAITING_FOR_AUTH', 'PAUSED', 'BLOCKED', 'FAILED', 'COMPLETED'].includes(state.status)) throw new Error(`Action blocked while agent is ${state.status}`);
}

export type OriginPermission = 'read' | 'write';
export function originOf(url: string): string { try { return new URL(url).origin; } catch { return ''; } }
export function requestedOrigins(goal: string): string[] { const origins = new Set<string>(); for (const match of goal.matchAll(/https?:\/\/[^\s)]+/gi)) { const origin = originOf(match[0].replace(/[.,;]+$/, '')); if (origin) origins.add(origin); } return [...origins]; }

export function createTaskState(runId: string, goal: string, maxSteps: number, timeoutMs: number): AgentTaskState {
  const requested = requestedOrigins(goal);
  return { runId, goal, status: 'IDLE', phase: 'understand', currentSubgoal: 'Understand the user goal', currentOrigin: '', origins: [], approvedOrigins: [...requested], requestedOrigins: requested, readableOrigins: [...requested], writableOrigins: [], confidence: 0, recoveryAttempts: 0, remainingSteps: maxSteps, deadlineAt: Date.now() + timeoutMs, cancelled: false, memory: {}, provenance: [], actions: [], progressHashes: [], completedMilestones: [] };
}

export function setOriginPermissions(state: AgentTaskState, readable: string[], writable: string[]): void {
  state.readableOrigins = [...new Set(readable.filter(Boolean))];
  state.writableOrigins = [...new Set(writable.filter(Boolean))];
  state.approvedOrigins = [...new Set([...state.readableOrigins, ...state.writableOrigins])];
}

export function isOriginApproved(state: AgentTaskState, origin: string, permission: OriginPermission = 'read'): boolean {
  if (!origin) return true;
  const set = permission === 'write' ? state.writableOrigins : state.readableOrigins;
  return set.includes(origin) || (permission === 'read' && state.requestedOrigins.includes(origin)) || (permission === 'write' && state.currentOrigin === origin);
}

export function addOrigin(state: AgentTaskState, origin: string): void { if (!origin) return; if (!state.origins.includes(origin)) state.origins.push(origin); state.currentOrigin = origin; }

export function normalizeActionArgs(args: unknown): string { try { return JSON.stringify(args, Object.keys((args as any) || {}).sort()); } catch { return String(args); } }
export function actionIdentity(name: string, origin: string, args: unknown): string { return createHash('sha256').update(`${name}|${origin}|${normalizeActionArgs(args)}`).digest('hex').slice(0, 24); }
export function actionRisk(name: string, args: any = {}): ActionRisk { const text = `${name} ${JSON.stringify(args)}`.toLowerCase(); if (/payment|purchase|transfer|delete|credential|password|security|legal|publish|send|submit|post/.test(text)) return 'critical'; if (/write|fill|key|download|upload/.test(text)) return 'medium'; return 'low'; }
export function isDuplicateAction(state: AgentTaskState, idempotencyKey: string): boolean { return state.actions.some((action) => action.idempotencyKey === idempotencyKey && action.status === 'verified'); }

export function recordAction(state: AgentTaskState, action: Omit<TaskActionRecord, 'at'>): void {
  const matching = [...state.actions].reverse().findIndex((entry) => (action.id && entry.id === action.id) || (entry.status === 'started' && entry.name === action.name && entry.origin === action.origin && entry.idempotencyKey === action.idempotencyKey));
  if (matching >= 0 && action.status !== 'started') { const index = state.actions.length - 1 - matching; state.actions[index] = { ...state.actions[index], ...action, at: Date.now() }; } else state.actions.push({ ...action, at: Date.now() });
  if (state.actions.length > 200) state.actions.splice(0, state.actions.length - 200);
}

export function computeStateHash(state: AgentTaskState): string { const material = JSON.stringify({ url: state.observation?.url, title: state.observation?.title, text: state.observation?.text?.slice(0, 4000), phase: state.phase, subgoal: state.currentSubgoal, memory: state.memory, milestones: state.completedMilestones }); return createHash('sha256').update(material).digest('hex').slice(0, 24); }
export function recordProgress(state: AgentTaskState): { hash: string; stuck: boolean } { const hash = computeStateHash(state); state.stateHash = hash; state.progressHashes.push(hash); if (state.progressHashes.length > 20) state.progressHashes.shift(); const recent = state.progressHashes.slice(-5); return { hash, stuck: recent.length === 5 && new Set(recent).size === 1 }; }
export function addMilestone(state: AgentTaskState, milestone: string): void { if (milestone && !state.completedMilestones.includes(milestone)) state.completedMilestones.push(milestone); }
export function recordProvenance(state: AgentTaskState, entry: TaskProvenance): void { const existing = state.provenance.find((item) => item.key === entry.key && item.value === entry.value && item.sourceUrl === entry.sourceUrl); if (!existing) state.provenance.push(entry); if (state.provenance.length > 100) state.provenance.shift(); }

export function isPromptInjection(text: string): boolean {
  const normalized = String(text || '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ');
  const words = normalized.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const fuzzy = (word: string, target: string) => word.length >= 5 && word.length === target.length && word[0] === target[0] && word.at(-1) === target.at(-1) && [...word.slice(1, -1)].sort().join('') === [...target.slice(1, -1)].sort().join('');
  const fuzzyHit = words.some((word) => ['ignore', 'disregard', 'override', 'reveal', 'delete'].some((target) => fuzzy(word, target)));
  return /(?:ignore|disregard|forget)\s+(?:(?:all|any|the|your|my|previous)\s+){0,3}(?:instructions|rules)|system\s+message|developer\s+message|reveal\s+(?:your|the)\s+(?:prompt|secrets?)|send\s+(?:password|cookie|token|credential)|you\s+are\s+now\s+(?:in\s+)?developer\s+mode/i.test(normalized) || fuzzyHit;
}

export function webContentForModel(text: string): string { const clipped = String(text || '').slice(0, 16000); return `[UNTRUSTED_WEB_CONTENT]\n${clipped}\n[/UNTRUSTED_WEB_CONTENT]`; }
export function deadlineExceeded(state: AgentTaskState): boolean { return Date.now() >= state.deadlineAt; }
