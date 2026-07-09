import { app, ipcMain } from 'electron';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Job, JobStatus, JobFilterOptions, JobUpdatePayload } from '../common/types/job.js';
import EventBus from './EventBus.js';
import BackgroundJobManager from './BackgroundJobManager.js';
import NotificationService from './NotificationService.js';

const JOB_DB_NAME = 'jobs.sqlite';
const MAX_CONCURRENT_JOBS = 3; // Example limit

class TaskQueueManager {
  private db!: Database;
  private jobDbPath: string;
  private queue: Job[] = [];
  private runningJobs: Map<string, Job> = new Map();
  private processingQueue: boolean = false;

  constructor() {
    try {
      this.jobDbPath = path.join(app.getPath('userData'), JOB_DB_NAME);
    } catch (e) {
      this.jobDbPath = `./${JOB_DB_NAME}`;
    }
    this.setupIPCHandlers();
  }

  async initialize(): Promise<void> {
    this.db = await open({
      filename: this.jobDbPath,
      driver: sqlite3.Database,
    });
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER,
        payload TEXT,
        result TEXT,
        error TEXT,
        createdAt INTEGER NOT NULL,
        startedAt INTEGER,
        completedAt INTEGER,
        failedAt INTEGER,
        cancelledAt INTEGER,
        duration INTEGER,
        retries INTEGER,
        maxRetries INTEGER,
        retryDelay INTEGER,
        priority INTEGER,
        isPersistent INTEGER,
        metadata TEXT
      );
    `);
    await this.loadPersistentJobs();
    this.processQueue();
  }

  private setupIPCHandlers() {
    ipcMain.handle('job:enqueue', async (_, job: Partial<Job>) => this.enqueueJob(job));
    ipcMain.handle('job:get-all', async (_, filter?: JobFilterOptions) => this.getAllJobs(filter));
    ipcMain.handle('job:get', async (_, id: string) => this.getJob(id));
    ipcMain.handle('job:cancel', async (_, id: string) => this.cancelJob(id));
    ipcMain.handle('job:pause', async (_, id: string) => this.pauseJob(id));
    ipcMain.handle('job:resume', async (_, id: string) => this.resumeJob(id));
    ipcMain.handle('job:clear-completed', async () => this.clearCompletedJobs());
  }

  private async loadPersistentJobs(): Promise<void> {
    const rows = await this.db.all<Job[]>('SELECT * FROM jobs WHERE isPersistent = 1 AND status IN (?, ?, ?)', ['queued', 'running', 'paused']);
    this.queue = rows.filter(job => job.status === 'queued' || job.status === 'paused').sort((a, b) => b.priority - a.priority);
    rows.filter(job => job.status === 'running').forEach(job => this.runningJobs.set(job.id, job));
    console.log(`Loaded ${this.queue.length} queued/paused jobs and ${this.runningJobs.size} running jobs from persistence.`);
  }

  async enqueueJob(job: Partial<Job>): Promise<Job> {
    const newJob: Job = {
      id: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: job.name || 'Unnamed Job',
      type: job.type || 'generic',
      status: 'queued',
      progress: 0,
      payload: job.payload || {},
      createdAt: Date.now(),
      retries: 0,
      maxRetries: job.maxRetries || 3,
      retryDelay: job.retryDelay || 5000, // 5 seconds
      priority: job.priority || 0,
      isPersistent: job.isPersistent !== undefined ? job.isPersistent : true,
      metadata: job.metadata || {},
    };

    this.queue.push(newJob);
    this.queue.sort((a, b) => b.priority - a.priority); // Sort by priority
    await this.saveJob(newJob);
    this.emitJobUpdate(newJob);
    this.processQueue();
    return newJob;
  }

  async updateJob(id: string, updates: JobUpdatePayload): Promise<Job | null> {
    let job = await this.getJob(id);
    if (!job) return null;

    job = { ...job, ...updates };
    if (updates.status) job.status = updates.status;
    if (updates.progress !== undefined) job.progress = updates.progress;
    if (updates.result) job.result = updates.result;
    if (updates.error) job.error = updates.error;
    if (updates.startedAt) job.startedAt = updates.startedAt;
    if (updates.completedAt) job.completedAt = updates.completedAt;
    if (updates.failedAt) job.failedAt = updates.failedAt;
    if (updates.cancelledAt) job.cancelledAt = updates.cancelledAt;
    if (updates.retries !== undefined) job.retries = updates.retries;
    if (updates.duration !== undefined) job.duration = updates.duration;

    await this.saveJob(job);
    this.emitJobUpdate(job);
    return job;
  }

  async getJob(id: string): Promise<Job | null> {
    const row = await this.db.get<Job>('SELECT * FROM jobs WHERE id = ?', id);
    if (!row) return null;
    return this.deserializeJob(row);
  }

  async getAllJobs(filter?: JobFilterOptions): Promise<Job[]> {
    let query = 'SELECT * FROM jobs';
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (filter?.status) {
      whereClauses.push('status = ?');
      params.push(filter.status);
    }
    if (filter?.type) {
      whereClauses.push('type = ?');
      params.push(filter.type);
    }
    if (filter?.name) {
      whereClauses.push('name LIKE ?');
      params.push(`%${filter.name}%`);
    }
    if (filter?.isPersistent !== undefined) {
      whereClauses.push('isPersistent = ?');
      params.push(filter.isPersistent ? 1 : 0);
    }
    if (filter?.dateRange) {
      whereClauses.push('createdAt BETWEEN ? AND ?');
      params.push(filter.dateRange.start, filter.dateRange.end);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    query += ' ORDER BY createdAt DESC';

    const rows = await this.db.all<Job[]>(query, params);
    return rows.map(row => this.deserializeJob(row));
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = await this.getJob(id);
    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }
    await this.updateJob(id, { status: 'cancelled', cancelledAt: Date.now() });
    this.runningJobs.delete(id);
    this.queue = this.queue.filter(qJob => qJob.id !== id);
    this.processQueue();
    return true;
  }

  async pauseJob(id: string): Promise<boolean> {
    const job = await this.getJob(id);
    if (!job || job.status !== 'running' && job.status !== 'queued') return false;
    await this.updateJob(id, { status: 'paused' });
    this.runningJobs.delete(id);
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
    return true;
  }

  async resumeJob(id: string): Promise<boolean> {
    const job = await this.getJob(id);
    if (!job || job.status !== 'paused') return false;
    await this.updateJob(id, { status: 'queued' });
    this.processQueue();
    return true;
  }

  async clearCompletedJobs(): Promise<void> {
    await this.db.run('DELETE FROM jobs WHERE status = ?', 'completed');
    // Also remove from queue/running if somehow still there (shouldn't be)
    this.queue = this.queue.filter(job => job.status !== 'completed');
    this.runningJobs.forEach(job => {
      if (job.status === 'completed') this.runningJobs.delete(job.id);
    });
    this.emitJobUpdate(); // Emit a general update to refresh UI
  }

  private async saveJob(job: Job): Promise<void> {
    const serializedJob = this.serializeJob(job);
    await this.db.run(
      `INSERT OR REPLACE INTO jobs (
        id, name, type, status, progress, payload, result, error,
        createdAt, startedAt, completedAt, failedAt, cancelledAt, duration,
        retries, maxRetries, retryDelay, priority, isPersistent, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      serializedJob.id, serializedJob.name, serializedJob.type, serializedJob.status, serializedJob.progress,
      serializedJob.payload, serializedJob.result, serializedJob.error,
      serializedJob.createdAt, serializedJob.startedAt, serializedJob.completedAt, serializedJob.failedAt, serializedJob.cancelledAt, serializedJob.duration,
      serializedJob.retries, serializedJob.maxRetries, serializedJob.retryDelay, serializedJob.priority, serializedJob.isPersistent,
      serializedJob.metadata
    );
  }

  private serializeJob(job: Job): any {
    return {
      ...job,
      payload: JSON.stringify(job.payload),
      result: job.result ? JSON.stringify(job.result) : null,
      metadata: JSON.stringify(job.metadata),
      isPersistent: job.isPersistent ? 1 : 0,
    };
  }

  private deserializeJob(row: any): Job {
    return {
      ...row,
      payload: JSON.parse(row.payload),
      result: row.result ? JSON.parse(row.result) : undefined,
      metadata: JSON.parse(row.metadata),
      isPersistent: row.isPersistent === 1,
      progress: row.progress || 0,
      retries: row.retries || 0,
      maxRetries: row.maxRetries || 3,
      retryDelay: row.retryDelay || 5000,
      priority: row.priority || 0,
      status: row.status as JobStatus,
    };
  }

  private emitJobUpdate(job?: Job) {
    EventBus.publish({
      id: `evt-job-${Date.now()}`,
      type: job ? `job:${job.status}` : 'job:updated',
      category: 'system',
      source: 'TaskQueueManager',
      payload: job || { type: 'all' },
      timestamp: Date.now(),
      priority: 1,
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.runningJobs.size >= MAX_CONCURRENT_JOBS) {
      return;
    }

    const nextJobIndex = this.queue.findIndex(job => job.status === 'queued');
    if (nextJobIndex === -1) {
      this.processingQueue = false;
      return;
    }

    this.processingQueue = true;
    const job = this.queue.splice(nextJobIndex, 1)[0];
    this.runningJobs.set(job.id, job);
    
    await this.updateJob(job.id, { status: 'running', startedAt: Date.now() });
    NotificationService.showNotification({
      type: 'info',
      title: `Job Started: ${job.name}`,
      message: `Job ${job.id} is now running.`,
      metadata: { jobId: job.id, jobName: job.name },
    });

    try {
      // Execute the job using BackgroundJobManager
      const result = await BackgroundJobManager.executeJob(job, (progress: number) => {
        this.updateJob(job.id, { progress });
      });
      await this.updateJob(job.id, { status: 'completed', completedAt: Date.now(), duration: Date.now() - (job.startedAt || job.createdAt), result });
      NotificationService.showNotification({
        type: 'success',
        title: `Job Completed: ${job.name}`,
        message: `Job ${job.id} completed successfully.`,
        metadata: { jobId: job.id, jobName: job.name },
      });
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);
      const newRetries = job.retries + 1;
      if (newRetries <= job.maxRetries) {
        const delay = job.retryDelay * Math.pow(2, newRetries - 1);
        await this.updateJob(job.id, { status: 'queued', retries: newRetries, error: error.message });
        NotificationService.showNotification({
          type: 'warning',
          title: `Job Failed (Retrying): ${job.name}`,
          message: `Job ${job.id} failed. Retrying in ${delay / 1000} seconds. Attempt ${newRetries}/${job.maxRetries}.`,
          metadata: { jobId: job.id, jobName: job.name, error: error.message },
        });
        setTimeout(() => this.processQueue(), delay);
      } else {
        await this.updateJob(job.id, { status: 'failed', failedAt: Date.now(), duration: Date.now() - (job.startedAt || job.createdAt), error: error.message });
        NotificationService.showNotification({
          type: 'error',
          title: `Job Failed: ${job.name}`,
          message: `Job ${job.id} failed after ${job.maxRetries} retries.`,
          metadata: { jobId: job.id, jobName: job.name, error: error.message },
        });
      }
    } finally {
      this.runningJobs.delete(job.id);
      this.processingQueue = false;
      this.processQueue(); // Process next job
    }
  }
}

export default new TaskQueueManager();
