import { connectDB } from "./lib/db";
import User from "./models/User";

async function check() {
  await connectDB();
  const user = await User.findOne();
  if (user) {
    console.log("Global refresh token:", user.googleRefreshToken ? "EXISTS" : "MISSING");
    console.log("Youtube channels count:", user.youtubeChannels?.length || 0);
    if (user.youtubeChannels?.length > 0) {
      console.log("Channel 0 Refresh Token:", user.youtubeChannels[0].refreshToken ? "EXISTS" : "MISSING");
    }
  } else {
    console.log("No user found");
  }
  process.exit(0);
}
check();
