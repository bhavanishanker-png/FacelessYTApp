import mongoose from "mongoose";
import Project from "./models/Project";
import dbConnect from "./lib/db";

async function run() {
  await dbConnect();
  
  // get any project
  const project = await Project.findOne();
  if (!project) return console.log("no project");

  console.log("Current scenes status:", project.steps.scenes.status);

  // simulate scenes update
  const data = { data: [{ text: "hi", prompt: "hi", duration: 5 }] };
  project.steps.scenes.data = data.data;
  project.steps.scenes.status = "completed";

  project.markModified("steps.scenes");
  project.markModified("currentStep");

  try {
    await project.save();
    console.log("scenes saved successfully. status is:", project.steps.scenes.status);
  } catch (e) {
    console.log("scenes error:", e.message);
  }

  // simulate images update
  console.log("now updating images");
  const imgData = { status: "completed" };
  project.steps.images = imgData;
  
  try {
    await project.save();
    console.log("images saved successfully");
  } catch(e) {
    console.log("images error:", e.message);
  }

  process.exit();
}
run();
