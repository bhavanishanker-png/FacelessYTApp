import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  const user = await db.collection("users").findOne({ email: "bhavanishankerpichuka@gmail.com" });
  console.log(JSON.stringify(user?.youtubeChannels?.map((c: any) => ({
    channelId: c.channelId,
    channelName: c.channelName,
    hasAccessToken: !!c.accessToken,
    hasRefreshToken: !!c.refreshToken
  })), null, 2));
  process.exit(0);
}
check();
