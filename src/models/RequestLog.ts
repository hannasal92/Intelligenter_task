import { Schema, model } from "mongoose";

const RequestLogSchema = new Schema({
  endpoint: String,
  method: String,
  domain: String,
  body: Schema.Types.Mixed,
  response: Schema.Types.Mixed,
  statusCode: Number,
  timestamp: { type: Date, default: () => new Date() }
});

export const RequestLogModel = model("RequestLog", RequestLogSchema);