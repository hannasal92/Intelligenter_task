import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db";
import { createServer } from "./api/serverRoutes";
import { analyzeQueue } from "./services/queue";
import "./worker/worker"; //we should run worker separately but u asked for one github url .
import { runSchedulerOnce } from "./scheduler/scheduler";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  await connectDB();

  //run scheduler at startup
  await runSchedulerOnce();

  //start the server
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});