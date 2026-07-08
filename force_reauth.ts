import { connectDB } from "./lib/db";
import User from "./models/User";

async function clearTokens() {
  await connectDB();
  const user = await User.findOne();
  if (user) {
    user.youtubeChannels = [];
    user.googleRefreshToken = "";
    user.markModified("youtubeChannels");
    user.markModified("googleRefreshToken");
    await user.save();
    console.log("Successfully cleared all YouTube tokens. User MUST re-authenticate.");
  }
  process.exit(0);
}
clearTokens();
