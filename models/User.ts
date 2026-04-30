import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    googleRefreshToken: {
      type: String,
    },
    googleAccessToken: {
      type: String,
    },
    youtubeChannels: {
      type: [
        {
          channelId: String,
          channelName: String,
          channelImage: String,
          accessToken: String,
          refreshToken: String,
          connectedAt: Date,
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

const User = models?.User || model("User", UserSchema);

export default User;
