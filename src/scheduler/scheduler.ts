import { analyzeQueue } from "../services/queue";
import { DomainModel } from "../models/Domain";

/**
 * Enqueue domains that haven't been updated in >30 days.
 */
export async function runSchedulerOnce() {
  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const staleDomains = await DomainModel.find({
    $or: [
      { lastUpdated: { $exists: false } },
      { lastUpdated: { $lt: thirtyDaysAgo } }
    ]
  }).limit(1000).lean();

  for (const d of staleDomains) {
    await analyzeQueue.add({ domain: d.domain }, { jobId: `analyze:${d.domain}` });
  }
  console.log(`Scheduler: enqueued ${staleDomains.length} domains`);
}
