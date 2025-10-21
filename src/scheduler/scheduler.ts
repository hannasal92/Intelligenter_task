import { analyzeQueue } from "../services/queue";
import { DomainModel } from "../models/Domain";

/**
 * Enqueue domains that haven't been updated in >30 days.
 */
// export async function runSchedulerOnce() {
//   // 1. Calculate a date that’s 30 days ago
//   const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

//   // 2. Find domains in MongoDB that are stale (not updated recently)
//   const staleDomains = await DomainModel.find({
//     $or: [
//       { lastUpdated: { $exists: false } },   // never updated
//       { lastUpdated: { $lt: thirtyDaysAgo } } // updated more than 30 days ago
//     ]
//   })
//   .limit(1000)   // take only max 1000 records at a time
//   .lean();       // return plain JS objects (faster, no mongoose overhead)

//   // 3. For each stale domain, add a job to the analyzeQueue
//   for (const d of staleDomains) {
//     await analyzeQueue.add(
//       { domain: d.domain },                 // job payload
//       { jobId: `analyze:${d.domain}` }      // unique jobId to avoid duplicates
//     );
//   }

//   // 4. Log how many jobs were enqueued
//   console.log(`Scheduler: enqueued ${staleDomains.length} domains`);
//   } 

  // export async function runSchedulerOnce() {
  //   const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  
  //   let skip = 0;
  //   let batchSize = 1000;
  //   let totalEnqueued = 0;
  
  //   while (true) {
  //     const staleDomains = await DomainModel.find({
  //       $or: [
  //         { lastUpdated: { $exists: false } },
  //         { lastUpdated: { $lt: thirtyDaysAgo } }
  //       ]
  //     })
  //       .skip(skip)
  //       .limit(batchSize)
  //       .lean();
  
  //     if (staleDomains.length === 0) break;
  
  //     for (const d of staleDomains) {
  //       await analyzeQueue.add({ domain: d.domain }, { jobId: `analyze:${d.domain}` });
  //     }
  
  //     totalEnqueued += staleDomains.length;
  //     skip += batchSize;
  //   }
  
  //   console.log(`Scheduler: enqueued ${totalEnqueued} domains`);
  // }
  
  // ⚠️ Problem:
	// •	skip becomes slow for very large collections (MongoDB has to scan through records to skip).
	// •	Loading big chunks into memory at once can also eat memory.


  // export async function runSchedulerOnce() {
  //   const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  
  //   // Create a cursor instead of fetching all documents at once
  //   const cursor = DomainModel.find({
  //     $or: [
  //       { lastUpdated: { $exists: false } },
  //       { lastUpdated: { $lt: thirtyDaysAgo } }
  //     ]
  //   }).cursor();
  
  //   let total = 0;
  
  //   // Loop through one record at a time
  //   for (let d = await cursor.next(); d != null; d = await cursor.next()) {
  //     await analyzeQueue.add(
  //       { domain: d.domain },
  //       { jobId: `analyze:${d.domain}` }
  //     );
  //     total++;
  //   }
  
  //   console.log(`Scheduler: enqueued ${total} domains`);
  // }

  //This is streaming: you only keep a little bit in memory at a time.




  export async function runSchedulerOnce() {
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  
      const cursor = DomainModel.find({
      $or: [
        { lastUpdated: { $exists: false } },   // never updated
        { lastUpdated: { $lt: thirtyDaysAgo } } // updated more than 30 days ago
      ]
      }).cursor();


  
    
    let batch = [];
    const batchSize = 100;
    let total = 0;
  
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      batch.push(doc);
  
      // If we hit batchSize → process the batch
      if (batch.length === batchSize) {
        await Promise.all(
          batch.map(d =>
            analyzeQueue.add({ domain: d.domain }, { jobId: `analyze:${d.domain}` })
          )
        );
        total += batch.length;
        batch = []; // reset
      }
    }
  
    // Process any leftover docs (less than batchSize)
    if (batch.length > 0) {
      await Promise.all(
        batch.map(d =>
          analyzeQueue.add({ domain: d.domain }, { jobId: `analyze:${d.domain}` })
        )
      );
      total += batch.length;
    }
  
    console.log(`Scheduler: enqueued ${total} domains`);
  }