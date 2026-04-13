import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("No MONGODB_URI");
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected directly to mongo", mongoose.connection.name);
  
  const projectColl = mongoose.connection.db!.collection("projects");
  
  const result = await projectColl.updateOne(
    { _id: new mongoose.Types.ObjectId("69dc08c1d8946e31584e7a38") },
    { $set: { "steps.scenes.status": "completed" } }
  );
  
  console.log("Updated target document:", result);
  process.exit();
}
run();
