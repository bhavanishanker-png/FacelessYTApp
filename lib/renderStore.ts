import type { ChildProcess } from "child_process";

export interface RenderJob {
  jobId: string;
  projectId: string;
  status: "queued" | "rendering" | "encoding" | "complete" | "failed" | "cancelled";
  progress: number;
  phase: string;
  startedAt: number;
  completedAt?: number;
  videoUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  error?: string;
  quality: string;
}

const jobs = new Map<string, RenderJob>();
const processes = new Map<string, ChildProcess>();

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
    processes.delete(jobId);
  },

  getByProject(projectId: string): RenderJob | undefined {
    for (const job of jobs.values()) {
      if (job.projectId === projectId) return job;
    }
    return undefined;
  },

  // Store the currently running FFmpeg process for a job
  setProcess(jobId: string, proc: ChildProcess) {
    processes.set(jobId, proc);
  },

  // Kill the active FFmpeg process and mark the job cancelled
  killJob(jobId: string) {
    const proc = processes.get(jobId);
    if (proc) {
      try { proc.kill("SIGTERM"); } catch {}
      processes.delete(jobId);
    }
    this.update(jobId, {
      status: "cancelled",
      phase: "Cancelled",
      error: "Render cancelled by user",
    });
  },
};
