import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
  userId: Types.ObjectId;
  title: string;
  type: "shorts" | "long";
  currentStep: string;
  status: "in-progress" | "completed";
  steps: {
    idea: {
      aiOutput: string;
      userSelected: string;
      status: string;
    };
    hook: {
      aiOutput: string[];
      selectedHook: string;
      editedHook: string;
      status: string;
    };
    script: {
      content: string;
      versions: string[];
      status: string;
    };
    scenes: {
      text: string;
      prompt: string;
      duration: number;
    }[];
    voice: {
      type: string;
      audioUrl: string;
      settings: Record<string, any>;
    };
    video: {
      videoUrl: string;
      status: string;
    };
  };
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["shorts", "long"], required: true },
    currentStep: { type: String, default: "idea" },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    steps: {
      idea: {
        aiOutput: { type: String, default: "" },
        userSelected: { type: String, default: "" },
        status: { type: String, default: "pending" },
      },
      hook: {
        aiOutput: { type: [String], default: [] },
        selectedHook: { type: String, default: "" },
        editedHook: { type: String, default: "" },
        status: { type: String, default: "pending" },
      },
      script: {
        content: { type: String, default: "" },
        versions: { type: [String], default: [] },
        status: { type: String, default: "pending" },
      },
      scenes: [
        {
          text: { type: String, default: "" },
          prompt: { type: String, default: "" },
          duration: { type: Number, default: 0 },
        },
      ],
      voice: {
        type: { type: String, default: "" },
        audioUrl: { type: String, default: "" },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      video: {
        videoUrl: { type: String, default: "" },
        status: { type: String, default: "pending" },
      },
    },
  },
  { timestamps: true }
);

// Prevent Next.js HMR from creating duplicate models
const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
