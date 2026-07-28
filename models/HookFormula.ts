import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHookFormula extends Document {
  id: string;
  formula: string;
  style: "question" | "statistic" | "story" | "controversial" | "visual";
  psychTrigger: string;
  niches: string[];
  tone: string[];
  exampleHook: string;
  estimatedRetention: number;
  active: boolean;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const HookFormulaSchema = new Schema<IHookFormula>(
  {
    id: { type: String, required: true, unique: true },
    formula: { type: String, required: true },
    style: {
      type: String,
      enum: ["question", "statistic", "story", "controversial", "visual"],
      required: true,
    },
    psychTrigger: { type: String, required: true },
    niches: [{ type: String }],
    tone: [{ type: String }],
    exampleHook: { type: String, required: true },
    estimatedRetention: { type: Number, default: 70 },
    active: { type: Boolean, default: true },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const HookFormula: Model<IHookFormula> =
  mongoose.models.HookFormula ||
  mongoose.model<IHookFormula>("HookFormula", HookFormulaSchema);

export default HookFormula;
