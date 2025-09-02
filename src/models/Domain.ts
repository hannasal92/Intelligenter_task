import { Schema, model } from "mongoose";

export interface IVTData {
  numberOfDetection?: number;
  numberOfScanners?: number;
  detectedEngines?: Record<string, any>;
  lastUpdated?: Date;
  raw?: any;
}

export interface IWhoisData {
  dateCreated?: Date;
  ownerName?: string;
  expiredOn?: Date;
  raw?: any;
}

export interface IDomain {
  domain: string;
  status: "onAnalysis" | "ready" | "error";
  vtData?: IVTData;
  whoisData?: IWhoisData;
  lastUpdated?: Date;
  createdAt?: Date;
  nextCheck?: Date;
}

const VTDataSchema = new Schema({
  numberOfDetection: Number,
  numberOfScanners: Number,
  detectedEngines: Schema.Types.Mixed,
  lastUpdated: Date,
  raw: Schema.Types.Mixed
}, { _id: false });

const WhoisSchema = new Schema({
  dateCreated: Date,
  ownerName: String,
  expiredOn: Date,
  raw: Schema.Types.Mixed
}, { _id: false });

const DomainSchema = new Schema<IDomain>({
  domain: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["onAnalysis", "ready", "error"], default: "onAnalysis" },
  vtData: VTDataSchema,
  whoisData: WhoisSchema,
  lastUpdated: Date,
  createdAt: { type: Date, default: () => new Date() },
  nextCheck: Date
});

export const DomainModel = model<IDomain>("Domain", DomainSchema);