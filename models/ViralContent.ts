import mongoose, { Schema, Document } from "mongoose";

export interface IViralContent extends Document {
  id: string;
  title: string;
  niche: string[];
  topic: string;
  hookType: string;
  hook: string;
  storytellingPattern: string;
  contentStructure: string;
  keyInsight: string;
  viralFactor: string;
  estimatedViews: string;
  tone: string[];
  active: boolean;
}

const ViralContentSchema = new Schema<IViralContent>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    niche: [{ type: String }],
    topic: { type: String, required: true },
    hookType: { type: String, required: true },
    hook: { type: String, required: true },
    storytellingPattern: { type: String, required: true },
    contentStructure: { type: String, required: true },
    keyInsight: { type: String, required: true },
    viralFactor: { type: String, required: true },
    estimatedViews: { type: String, default: "1M+" },
    tone: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ViralContentSchema.index({ niche: 1 });
ViralContentSchema.index({ topic: 1 });

export default mongoose.models.ViralContent ||
  mongoose.model<IViralContent>("ViralContent", ViralContentSchema);
