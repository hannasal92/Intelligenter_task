import Bull from "bull";
import dotenv from "dotenv";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const analyzeQueue = new Bull("analyzeQueue", REDIS_URL, {
  // optional settings
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,        // Retry failed jobs in this queue 3 times before giving up
    backoff: 10000,     // Wait 10 seconds between retries
  }
});

// Secondary queue — for failed analyses
export const failedAnalyzeQueue = new Bull("failedAnalyzeQueue", REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,        // Retry failed jobs in this queue 3 times before giving up
    backoff: 10000,     // Wait 10 seconds between retries
  },
});

// also we should add health check to to check if all the resourses are online mongodb , redis third party

