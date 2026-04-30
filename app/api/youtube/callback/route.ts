import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?error=NoCodeProvided", request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the connected YouTube channel details
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({ part: ["snippet"], mine: true });
    
    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      return NextResponse.redirect(new URL("/dashboard?error=NoYouTubeChannelFound", request.url));
    }

    const channel = channelRes.data.items[0];
    const channelId = channel.id!;
    const channelName = channel.snippet?.title || "Unknown Channel";
    const channelImage = channel.snippet?.thumbnails?.default?.url || "";

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if channel is already linked, if so, update tokens. Otherwise, add new.
    const existingChannelIndex = user.youtubeChannels.findIndex((c: any) => c.channelId === channelId);

    if (existingChannelIndex >= 0) {
      user.youtubeChannels[existingChannelIndex].accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.youtubeChannels[existingChannelIndex].refreshToken = tokens.refresh_token;
      }
      user.youtubeChannels[existingChannelIndex].channelName = channelName;
      user.youtubeChannels[existingChannelIndex].channelImage = channelImage;
    } else {
      user.youtubeChannels.push({
        channelId,
        channelName,
        channelImage,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "", // Make sure to request prompt='consent'
        connectedAt: new Date(),
      });
    }

    // Optional: Keep the legacy global tokens synced to the first connected channel
    if (!user.googleRefreshToken && tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
      user.googleAccessToken = tokens.access_token;
    }

    await user.save();

    return NextResponse.redirect(new URL("/dashboard/settings?success=ChannelConnected", request.url));
  } catch (error: any) {
    console.error("YouTube OAuth Callback Error:", error);
    return NextResponse.redirect(new URL("/dashboard/settings?error=AuthFailed", request.url));
  }
}
