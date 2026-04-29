import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

const VALID_STEPS = [
  "idea",
  "hook",
  "script",
  "scenes",
  "images",
  "animation",
  "voice",
  "subtitles",
  "composition",
  "editor",
  "render",
];

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // 2. Parse payload
    const body = await request.json();
    const { projectId, step, data, nextStep } = body;

    // 3. Validate input
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    if (!step || !VALID_STEPS.includes(step)) {
      return NextResponse.json({ error: `Invalid step. Executable steps are: ${VALID_STEPS.join(', ')}` }, { status: 400 });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "A valid 'data' object payload is required" }, { status: 400 });
    }

    // 3.5 Step-Specific Validation Rules
    // These validate content integrity when real data is sent.
    // Status-only payloads (e.g. { status: "completed" }) are always allowed
    // so the frontend can advance steps before AI generation is wired.
    const isStatusOnly = Object.keys(data).every(k => k === "status");

    if (!isStatusOnly) {
      if (step === "idea" && !data.userSelected) {
        return NextResponse.json({ error: "Idea step requires 'userSelected' string" }, { status: 400 });
      }
      if (step === "hook" && !data.selectedHook) {
        return NextResponse.json({ error: "Hook step requires 'selectedHook' string" }, { status: 400 });
      }
      if (step === "script" && !data.content) {
        return NextResponse.json({ error: "Script step requires 'content' string" }, { status: 400 });
      }
      if (step === "scenes" && !Array.isArray(data.data)) {
        return NextResponse.json({ error: "Scenes step data requires a 'data' array property" }, { status: 400 });
      }
      if (step === "images" && !Array.isArray(data.data) && !data.imageUrl && !data.prompt) {
        return NextResponse.json({ error: "Images step requires 'data' array, 'imageUrl', or 'prompt'" }, { status: 400 });
      }
      if (step === "animation" && !data.preset && data.duration === undefined) {
        return NextResponse.json({ error: "Animation step requires 'preset' or 'duration'" }, { status: 400 });
      }
      if (step === "voice" && !data.type && !data.voiceType && !data.voiceId && !data.audioUrl) {
        return NextResponse.json({ error: "Voice step requires 'type', 'voiceType', 'voiceId', or 'audioUrl'" }, { status: 400 });
      }
      if (step === "subtitles" && !data.data && !data.settings) {
        return NextResponse.json({ error: "Subtitles step requires 'data' or 'settings'" }, { status: 400 });
      }
      if (step === "editor" && !data.editedData) {
        return NextResponse.json({ error: "Editor step requires 'editedData'" }, { status: 400 });
      }
    }

    await connectDB();

    // 4. Validate ownership by inherently scoping the query to the user
    // We use findOne to verify it exists and is owned by the logged-in user securely.
    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access" },
        { status: 404 }
      );
    }

    // 5. Update data flexibly (Merge existing state with new incoming data for this step)
    // 5a. Guarantee the root Steps object exists to prevent `TypeError: Cannot set properties of undefined`
    if (!project.steps) {
      project.steps = {} as any;
    }

    // 5b. Safely initialize targeting pointer if it is virgin territory
    if (!(project.steps as any)[step]) {
      (project.steps as any)[step] = {};
    }

    const existingStepData = (project.steps as any)[step];

    // 5c. Automatically deduce timeline status
    // If the frontend transmitted a `nextStep` target to leap visually, they strictly signaled completion. 
    // Otherwise, it was a background auto-save event.
    const deducedStatus = nextStep ? "completed" : "editing";

    // 5d. Safely update fields using Mongoose's dynamic proxy by mutating directly rather than replacing the parent root completely
    if (typeof data === "object" && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        (project.steps as any)[step][key] = value;
      }
      (project.steps as any)[step].status = data.status || deducedStatus;
    } else {
      (project.steps as any)[step] = data;
    }

    // 6. Strict Progression Flow Logic
    const savingIndex = VALID_STEPS.indexOf(step);
    const currentIndex = VALID_STEPS.indexOf(project.currentStep || "idea");

    // 6a. Prevent: Skipping steps forward
    // A user cannot write data to a step they have not legitimately unlocked yet.
    if (savingIndex > currentIndex) {
      return NextResponse.json({ error: "Cannot skip workflow steps forward. Complete preceding steps first." }, { status: 403 });
    }

    // 6b. Allow: Going backward cleanly without pointer regression
    // Safely advance pointer automatically on completion trigger, strictly clamped to +1 maximum chronological jump.
    if (nextStep && VALID_STEPS.includes(nextStep)) {
        const nextTargetIndex = VALID_STEPS.indexOf(nextStep);
        
        // Prevent bypassing workflow natively (Next target can at most be exactly the next chronological step of the one they are saving)
        if (nextTargetIndex > savingIndex + 1) {
             return NextResponse.json({ error: "Cannot traverse multiple steps at once." }, { status: 403 });
        }

        // Only move the global pointer forward if this leap breaks new ground cleanly.
        if (nextTargetIndex > currentIndex && nextTargetIndex < VALID_STEPS.length) {
            project.currentStep = VALID_STEPS[nextTargetIndex];
        }
    }

    // Ensure we trigger mongoose save mapping cleanly
    project.markModified(`steps.${step}`);
    project.markModified("currentStep");
    
    // Auto-repair corrupt Mongoose states resulting from previous proxy bugs
     if (project.steps?.scenes && !["pending", "editing", "completed"].includes(project.steps.scenes.status)) {
        project.steps.scenes.status = "editing";
     }

    await project.save();

    return NextResponse.json({
      stepData: (project.steps as any)[step],
      currentStep: project.currentStep,
      status: (project.steps as any)[step].status
    }, { status: 200 });
  } catch (error: any) {
    console.error("update-step API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
