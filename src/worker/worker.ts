import { analyzeQueue, failedAnalyzeQueue } from "../services/queue";
import { analyzeDomain } from "../services/analyzer";
import { DomainModel } from "../models/Domain";
import dotenv from "dotenv";
dotenv.config();

const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY || "2", 10);

analyzeQueue.process(CONCURRENCY, async (job) => {
  const domain: string = job.data.domain;
  console.log(`Worker: processing ${domain}`);
  analayzDomains(domain);

});

failedAnalyzeQueue.process(CONCURRENCY, async (job) => {
  const domain: string = job.data.domain;
  console.log(`Worker: processing ${domain}`);
  analayzDomains(domain);

});

async function analayzDomains(domain : string) {
  try {
    // set status to onAnalysis
    await DomainModel.findOneAndUpdate({ domain }, { status: "onAnalysis" }, { upsert: true });

    const results = await analyzeDomain(domain);
    const {harmless , malicious} = results.vtData?.data?.attributes?.total_votes ;
    // update DB
    const resultDB = await DomainModel.findOneAndUpdate(
      { domain },
      {
        $set: {
          vtData: results.vtData.data,
          whoisData: results.whoisData.WhoisRecord,
          lastUpdated: new Date(results.lastUpdated),
          nextCheck: new Date(results.nextCheck),
          status: "ready"
        }
      },
      { upsert: true }
    ).lean();
    console.log(resultDB)
    console.log(`Worker: finished ${domain}`);
    return { ok: true };
  } catch (err) {
    console.error("Worker error", err);
    await DomainModel.findOneAndUpdate({ domain }, { status: "error" });
    // if we tried 5 times and fail we should save the domain in database or redis to reschedular
    // send it to redis
    await failedAnalyzeQueue.add({ domain }, { jobId: `failedAnalyzeDomains:${domain}` });
    //throw err;
  }
}


// Jobs in queue: [A, B, C, D, E]111222121222
// CONCURRENCY = 23232

/*
Execution:1111sdd
	1.	Worker picks A and B → runs them in parallel
	2.	Once A finishes → pick C
	3.	Once B finishes → pick D
	4.	Finally → pick E

This ensures your system isn’t overloaded by processing too many jobs at once.

	•	analyzeQueue.process(...) defines a worker function for the queue.
	•	CONCURRENCY = max number of jobs that can be processed at the same time.
	•	If CONCURRENCY = 2, the worker will pick 2 jobs at a time.
	•	Other jobs wait in the queue until one finishes.
	•	job = the current job object from the queue (job.data has the payload).

  🔹 Why it’s useful
	•	Controls CPU / memory usage.
	•	Prevents overwhelming databases or external APIs when processing jobs.
	•	Lets you tune workers based on your server capacity.




  so after the worker update the database and it is risk domain we can do that the worker can send a message to kafka and the notification listen to this topic and notification can update the client by the websocker ?
so after the worker update the database and it is risk domain we can do that the worker can send a message to kafka and the notification listen to this topic and notification can update the client by the websocker ?
  const status = virusTotalPositives > THRESHOLD ? "dangerous" : "safe";

// update database first
await DomainModel.updateOne(
  { domain },
  { $set: { virusTotalScore: virusTotalPositives, status, lastUpdated: new Date() } },
  { upsert: true }
);

// if dangerous, send message to Kafka
if (status === "dangerous") {
  await kafkaProducer.send({
    topic: "domain-risk-alerts",
    messages: [
      { key: domain, value: JSON.stringify({ domain, status, virusTotalScore: virusTotalPositives }) }
    ]
  });
}

kafkaConsumer.subscribe({ topic: "domain-risk-alerts" });

kafkaConsumer.run({
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());

    // broadcast via WebSocket to connected clients
    io.emit("domain-alert", data);
  }
});


const socket = io("https://your-server.com");

socket.on("domain-alert", (data) => {
  console.log("Dangerous domain detected:", data.domain, data.status);
  // update UI: highlight, block, or alert
});


4️⃣ Why this is good
	•	✅ Scalable: worker can produce messages quickly; notification service handles delivery.
	•	✅ Decoupled: workers don’t need to manage WebSocket connections.
	•	✅ Reliable: Kafka persists messages in case of network or server issues.
	•	✅ Extensible: you can add more consumers (e.g., email alerts, Slack notifications) without changing the worker.
  
*/