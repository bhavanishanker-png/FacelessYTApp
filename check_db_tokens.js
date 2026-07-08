const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.useDb('test'); // Check database name!
  const user = await mongoose.connection.collection('users').findOne({});
  if (user) {
    console.log("Global refresh token:", user.googleRefreshToken ? "EXISTS" : "MISSING");
    console.log("Youtube channels count:", user.youtubeChannels?.length || 0);
    if (user.youtubeChannels?.length > 0) {
      console.log("Channel 0:", JSON.stringify(user.youtubeChannels[0], null, 2));
    }
  } else {
    console.log("No user found");
  }
  process.exit(0);
}
check();
