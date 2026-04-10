import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load jobs.json from project root at module init time (bundled with deployment)
const seedJobs: any[] = require(join(__dirname, '..', 'jobs.json'));

// Runtime-added jobs (generated via AI, ephemeral per cold start)
let runtimeJobs: any[] = [];

export function getAllJobs(): any[] {
  return [...seedJobs, ...runtimeJobs];
}

export function findJobBySlug(slug: string): any | undefined {
  return getAllJobs().find((j) => j.slug === slug);
}

export function findJobById(id: string): any | undefined {
  return getAllJobs().find((j) => j.id === id);
}

export function addJob(job: any): void {
  runtimeJobs.push(job);
}

export function updateJob(id: string, updates: any): any | null {
  // Check runtime jobs first
  const rIdx = runtimeJobs.findIndex((j) => j.id === id);
  if (rIdx !== -1) {
    runtimeJobs[rIdx] = { ...runtimeJobs[rIdx], ...updates };
    return runtimeJobs[rIdx];
  }
  // Seed jobs are read-only at runtime; clone into runtimeJobs to allow edits
  const sJob = seedJobs.find((j) => j.id === id);
  if (sJob) {
    const updated = { ...sJob, ...updates };
    runtimeJobs.push(updated);
    // Mark seed as overridden
    (sJob as any).__overridden = true;
    return updated;
  }
  return null;
}

export function deleteJob(id: string): boolean {
  const before = runtimeJobs.length;
  runtimeJobs = runtimeJobs.filter((j) => j.id !== id);
  // Mark seed job as deleted
  const sJob = seedJobs.find((j) => j.id === id);
  if (sJob) (sJob as any).__deleted = true;
  return runtimeJobs.length < before || !!sJob;
}
