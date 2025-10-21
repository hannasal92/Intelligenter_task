import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intelligenter";
//"mongodb://mongos-router-1:27017,mongos-router-2:27017/intelligenter?replicaSet=myReplSet&readPreference=primary";
 
export async function connectDB() {
  let attempt = 0;

  const connect = async () => {
    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 5,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ Connected to MongoDB with pooling");
    } catch (err) {
      console.error("❌ MongoDB initial connection error:", err);
      // Retry after delay
      setTimeout(connect, 5000);
    }
  };

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected! Attempting to reconnect...");
    attempt++;
    if(attempt > 5){
      process.exit(1);
    }
    connect();
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
    // Optional: alert admin or trigger monitoring
  });

  // Initial connect
  await connect();
}
