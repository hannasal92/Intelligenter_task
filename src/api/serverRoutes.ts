import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { domainSchema } from "../utils/validation";
import { RequestLogModel } from "../models/RequestLog";
import { DomainModel } from "../models/Domain";
import { analyzeQueue } from "../services/queue";

const router = express.Router();

router.get("/get", async (req, res) => {
  const domain = String(req.query.domain || "").toLowerCase();

  // Validate the domain
  const { error } = domainSchema.validate({ domain });
  if (error) {
    await RequestLogModel.create({ endpoint: "/get", method: "GET", domain, body: req.query, response: { error: error.message }, statusCode: 400 });
    return res.status(400).json({ error: error.message });
  }

  const record = await DomainModel.findOne({ domain }).lean();
  if (!record) {
    // create a record in DB with status onAnalysis and enqueue
    await DomainModel.create({ domain, status: "onAnalysis", createdAt: new Date() });

    // send it to redis
    await analyzeQueue.add({ domain }, { jobId: `analyze:${domain}` });
    const response = { domain, status: "onAnalysis" };

    // insert new document to RequestLogs collection.
    await RequestLogModel.create({ endpoint: "/get", method: "GET", domain, body: req.query, response, statusCode: 202 });
    return res.status(202).json(response);
  }

  // insert new document to RequestLogs collection.
  await RequestLogModel.create({ endpoint: "/get", method: "GET", domain, body: req.query, response: record, statusCode: 200 });
  return res.json(record);
});

router.post("/post", express.json(), async (req, res) => {
  const payload = { domain: (req.body.domain || "").toLowerCase() };
  const { error } = domainSchema.validate(payload);
  if (error) {
    await RequestLogModel.create({ endpoint: "/post", method: "POST", domain: payload.domain, body: req.body, response: { error: error.message }, statusCode: 400 });
    return res.status(400).json({ error: error.message });
  }

  const existing = await DomainModel.findOne({ domain: payload.domain });

  if (existing && existing.status === "onAnalysis") {
    const response = { domain: payload.domain, status: "onAnalysis", message: "alreadyOnAnalysis" };
    await RequestLogModel.create({ endpoint: "/post", method: "POST", domain: payload.domain, body: req.body, response, statusCode: 202 });
    return res.status(202).json(response);
  }

  // create or update to onAnalysis in the db
  await DomainModel.findOneAndUpdate({ domain: payload.domain }, { $set: { status: "onAnalysis", createdAt: existing?.createdAt || new Date() } }, { upsert: true });

  // send it to redis
  await analyzeQueue.add({ domain: payload.domain }, { jobId: `analyze:${payload.domain}` });
  const response = { domain: payload.domain, status: "onAnalysis" };

  // insert new document to RequestLogs collection.
  await RequestLogModel.create({ endpoint: "/post", method: "POST", domain: payload.domain, body: req.body, response, statusCode: 202 });
  return res.status(202).json(response);
});

export function createServer() {
  const app = express();
  // helmet It sets various HTTP headers to protect against attacks (XSS, clickjacking, MIME sniffing, etc.).
  app.use(helmet());
  // Rate Limiting Prevents abuse and DoS attacks by limiting how many requests a client can make.
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10)
  });
  app.use(limiter);
  //is a middleware that helps protect your app from NoSQL injection attacks in MongoDB.
  app.use(mongoSanitize());
  app.use(router);
  return app;
}