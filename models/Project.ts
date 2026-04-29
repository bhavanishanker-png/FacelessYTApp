import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
  userId: Types.ObjectId;
  title: string;
  type: "shorts" | "long";
  currentStep: string;
  status: "in-progress" | "completed";
  steps: {
    idea: {
      aiOutput: any;
      userSelected: string;
      status: string;
    };
    hook: {
      aiOutput: any[];
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
      aiOutput: any[];
      status: string;
      data: {
        text: string;
        prompt: string;
        duration: number;
      }[];
    };
    images: {
      status: string;
      style: string;
      data: {
        sceneId: string;
        imageUrl: string;
        prompt: string;
        status: string;
        error?: string;
      }[];
    };
    animation: { status: string; data: any };
    voice: {
      type: string;
      voiceId: string;
      audioUrl: string;
      durationSeconds: number;
      provider: string;
      settings: Record<string, any>;
      status: string;
    };
    subtitles: {
      status: string;
      data: {
        text: string;
        start: number;
        end: number;
        words?: any[];
      }[];
      settings?: Record<string, any>;
    };
    composition: { status: string; data: any };
    editor: { status: string; data: any };
    render: {
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
        aiOutput: { type: Schema.Types.Mixed, default: null }, // Stores raw ViralIdeasOutput
        userSelected: { type: String, default: "" },
        status: { type: String, default: "pending" },
      },
      hook: {
        aiOutput: { type: Schema.Types.Mixed, default: [] }, // Stores ViralHook[]
        selectedHook: { type: String, default: "" },
        editedHook: { type: String, default: "" },
        status: { type: String, default: "pending" },
      },
      script: {
        content: { type: String, default: "" },
        versions: { type: [String], default: [] }, // Preserves script generation history
        status: { type: String, default: "pending" },
      },
      scenes: {
        aiOutput: { type: Schema.Types.Mixed, default: [] }, // Stores initial AI scenes breakdown
        status: { type: String, enum: ["pending", "editing", "completed"], default: "pending" },
        data: {
          type: [
            {
              text: { type: String, default: "" },
              prompt: { type: String, default: "" },
              duration: { type: Number, default: 0 },
            },
          ],
          default: [],
        },
      },
      images: {
        status: { type: String, default: "pending" },
        style: { type: String, default: "" },
        data: {
          type: [
            {
              sceneId: { type: String, default: "" },
              imageUrl: { type: String, default: "" },
              prompt: { type: String, default: "" },
              status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },
              error: { type: String, default: "" },
            },
          ],
          default: [],
        },
      },
      animation: {
        status: { type: String, default: "pending" },
        data: { type: Schema.Types.Mixed, default: {} },
      },
      voice: {
        type: { type: String, default: "" },
        voiceId: { type: String, default: "" },
        audioUrl: { type: String, default: "" },
        durationSeconds: { type: Number, default: 0 },
        provider: { type: String, default: "" },
        settings: { type: Schema.Types.Mixed, default: {} },
        status: { type: String, default: "pending" },
      },
      subtitles: {
        status: { type: String, default: "pending" },
        data: {
          type: [
            {
              text: { type: String, default: "" },
              start: { type: Number, default: 0 },
              end: { type: Number, default: 0 },
              words: { type: Schema.Types.Mixed, default: [] },
            },
          ],
          default: [],
        },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      composition: {
        status: { type: String, default: "pending" },
        data: { type: Schema.Types.Mixed, default: {} },
      },
      editor: {
        status: { type: String, default: "pending" },
        data: { type: Schema.Types.Mixed, default: {} },
      },
      render: {
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
