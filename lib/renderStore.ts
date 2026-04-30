/**
 * In-memory render job store for tracking FFmpeg render progress.
 * 
 * In production this would be Redis/BullMQ. For the MVP this lightweight
 * Map-based store is sufficient since the Next.js server process holds
 * the state for the duration of the render.
 */

export interface RenderJob {
  jobId: string;
  projectId: string;
  status: "queued" | "rendering" | "encoding" | "complete" | "failed";
  progress: number;        // 0–100
  phase: string;           // Human-readable current phase
  startedAt: number;       // Date.now()
  completedAt?: number;
  videoUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  error?: string;
  quality: string;
}

const jobs = new Map<string, RenderJob>();

export const renderStore = {
  create(job: RenderJob) {
    jobs.set(job.jobId, job);
  },

  get(jobId: string): RenderJob | undefined {
    return jobs.get(jobId);
  },

  update(jobId: string, patch: Partial<RenderJob>) {
    const existing = jobs.get(jobId);
    if (existing) {
      jobs.set(jobId, { ...existing, ...patch });
    }
  },

  delete(jobId: string) {
    jobs.delete(jobId);
  },

  getByProject(projectId: string): RenderJob | undefined {
    for (const job of jobs.values()) {
      if (job.projectId === projectId) return job;
    }
    return undefined;
  },
};
