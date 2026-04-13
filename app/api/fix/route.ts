import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  await connectDB();
  
  // Direct mongo connection
  const db = mongoose.connection.db;
  if (!db) {
     return NextResponse.json({error: "no db"})
  }
  const projects = await db.collection("projects").find({}).toArray();
  
  const badStatuses = projects.map(p => ({
     id: p._id,
     status: p.steps?.scenes?.status
  }));

  const valid = ["draft", "editing", "processing", "completed"];
  let fixed = 0;
  for (const p of projects) {
      const scenes = p.steps?.scenes;
      
      // If scenes is literally an array, we must convert it to the proper schema object
      if (Array.isArray(scenes)) {
          await db.collection("projects").updateOne(
             { _id: p._id }, 
             { $set: { "steps.scenes": { status: "completed", data: scenes } } }
          );
          fixed++;
          continue;
      }
      
      // If scenes is an object but status is corrupt
      if (scenes && typeof scenes === "object" && !valid.includes(scenes.status)) {
         await db.collection("projects").updateOne(
            { _id: p._id }, 
            { $set: { "steps.scenes.status": "editing" } }
         );
         fixed++;
      }
  }

  return NextResponse.json({
    message: "DB Cleansed",
    fixed
  });
}
