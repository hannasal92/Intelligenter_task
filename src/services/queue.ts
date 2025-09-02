import Bull from "bull";
import dotenv from "dotenv";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const analyzeQueue = new Bull("analyzeQueue", REDIS_URL, {
  // optional settings
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  }
});