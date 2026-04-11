import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStep {
  aiOutput: string;
  userEditedOutput: string;
  status: "pending" | "editing" | "approved";
  version: number;
}

export interface IProject extends Document {
  title: string;
  type: "shorts" | "long";
  currentStep: string;
  status: "in-progress" | "completed";
  steps: {
    idea: IStep;
    hook: IStep;
    script: IStep;
    scenes: IStep;
    voice: IStep;
    video: IStep;
  };
}

const StepSchema = new Schema<IStep>(
  {
    aiOutput: { type: String, default: "" },
    userEditedOutput: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "editing", "approved"],
      default: "pending",
    },
    version: { type: Number, default: 1 },
  },
  { _id: false } // Prevent mongoose from generating an _id for every subdocument
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["shorts", "long"], required: true },
    currentStep: { type: String, default: "idea" },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    steps: {
      idea: { type: StepSchema, default: () => ({}) },
      hook: { type: StepSchema, default: () => ({}) },
      script: { type: StepSchema, default: () => ({}) },
      scenes: { type: StepSchema, default: () => ({}) },
      voice: { type: StepSchema, default: () => ({}) },
      video: { type: StepSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

// Prevent Next.js HMR from creating duplicate models
const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
