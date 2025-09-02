import { analyzeQueue } from "../services/queue";
import { analyzeDomain } from "../services/analyzer";
import { DomainModel } from "../models/Domain";
import dotenv from "dotenv";
dotenv.config();

const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY || "2", 10);

analyzeQueue.process(CONCURRENCY, async (job) => {
  const domain: string = job.data.domain;
  console.log(`Worker: processing ${domain}`);

  try {
    // set status to onAnalysis
    await DomainModel.findOneAndUpdate({ domain }, { status: "onAnalysis" }, { upsert: true });

    const results = await analyzeDomain(domain);

    // update DB
    await DomainModel.findOneAndUpdate(
      { domain },
      {
        $set: {
          vtData: results.vtData,
          whoisData: results.whoisData,
          lastUpdated: results.lastUpdated,
          nextCheck: results.nextCheck,
          status: "ready"
        }
      },
      { upsert: true }
    );

    console.log(`Worker: finished ${domain}`);
    return { ok: true };
  } catch (err) {
    console.error("Worker error", err);
    await DomainModel.findOneAndUpdate({ domain }, { status: "error" });
    throw err;
  }
});

analyzeQueue.on("failed", (job, err) => {
  console.error("Job failed", job.id, job.data, err);
});