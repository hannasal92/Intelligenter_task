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


/*
	•	rateLimit() → creates a middleware that restricts how many requests a client can make in a certain time window.
	•	app.use(limiter) → applies the rate limiter to all routes.

  	•	Defines the time window in milliseconds for counting requests.
	•	Default: 60000 ms → 1 minute.
	•	Example:
	•	If windowMs = 60000, then every client gets a fresh count every 1 minute.

⸻

2. max
max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10)
	•	Maximum number of requests allowed per client in the given windowMs.
	•	Default: 60 → 60 requests per minute.
	•	After exceeding max, the server will respond with HTTP 429 Too Many Requests.


  Why it’s useful
	•	Prevents DDoS attacks or accidental request floods.
	•	Protects your server and database from being overwhelmed.
	•	Gives a consistent fair usage per client.



  the number 10 
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10)
parseInt(process.env.RATE_LIMIT_MAX || "60", 10)
string → the value you want to convert to an integer.
	•	radix → the base of the number system (2 for binary, 8 for octal, 10 for decimal, 16 for hex, etc.).

⸻

  	•	"60000" → string from environment variable (or default).
	•	10 → tells JavaScript to interpret it as a decimal number.
	•	Result: 60000 (number type, not string).
*/

/*
Instead of your system polling VirusTotal repeatedly, some services provide webhooks / push notifications:
	•	A webhook is basically an HTTP callback.
	•	When an event happens on the service (e.g., a domain becomes malicious), the service sends a request to your server automatically.
	•	This way, your system doesn’t need to ask repeatedly; it’s “pushed” the data.

In this case:
	•	VirusTotal could notify your server immediately when a domain is flagged as dangerous.
	•	Your server can then:
	1.	Update the database (status = dangerous)
	2.	Notify clients via WebSocket or other real-time mechanism

⸻

2️⃣ How it works in practice
	1.	Register a webhook URL with VirusTotal (or any security service that supports it):

  */