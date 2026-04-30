import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { videoUrl, title, description, tags, visibility = "private", channelId } = await request.json();

    if (!videoUrl || !title) {
      return NextResponse.json({ error: "videoUrl and title are required" }, { status: 400 });
    }

    // 2. Fetch User to get Google Refresh Token
    await connectDB();
    const user = await User.findById(userId);

    let targetRefreshToken = user?.googleRefreshToken;
    let targetAccessToken = user?.googleAccessToken;

    if (channelId && user?.youtubeChannels?.length > 0) {
      const channelInfo = user.youtubeChannels.find((c: any) => c.channelId === channelId);
      if (channelInfo && channelInfo.refreshToken) {
        targetRefreshToken = channelInfo.refreshToken;
        targetAccessToken = channelInfo.accessToken;
      }
    }

    if (!user || !targetRefreshToken) {
      return NextResponse.json(
        { error: "YouTube account not connected or missing upload permissions. Please connect your channel." },
        { status: 403 }
      );
    }

    // 3. Initialize OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: targetRefreshToken,
      access_token: targetAccessToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // 4. Prepare video stream
    let mediaStream;
    let contentLength = 0;
    
    if (videoUrl.startsWith("http")) {
      const response = await fetch(videoUrl);
      if (!response.ok || !response.body) {
        throw new Error("Failed to fetch the video file from the provided videoUrl");
      }
      
      contentLength = Number(response.headers.get("content-length") || 0);
      
      // Node.js >= 18 supports Readable.fromWeb
      // Next.js polyfills/provides web streams for fetch body
      mediaStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
    } else {
      // Local file fallback
      const fs = require("fs");
      const path = require("path");
      const filePath = videoUrl.startsWith("/") 
        ? path.join(process.cwd(), "public", videoUrl)
        : path.join(process.cwd(), "public", "/", videoUrl);
        
      if (!fs.existsSync(filePath)) {
        throw new Error(`Local video file not found: ${filePath}`);
      }
      mediaStream = fs.createReadStream(filePath);
      contentLength = fs.statSync(filePath).size;
    }

    // 5. Upload to YouTube
    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags: tags || [],
          categoryId: "22", // People & Blogs
        },
        status: {
          privacyStatus: visibility, // "public", "private", or "unlisted"
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: mediaStream,
      },
    }, {
      // Options to handle large uploads if needed
      maxRedirects: 5
    });

    if (res.data?.id) {
      return NextResponse.json({
        success: true,
        videoId: res.data.id,
        videoUrl: `https://www.youtube.com/watch?v=${res.data.id}`,
      });
    }

    throw new Error("Upload succeeded but no video ID returned from YouTube");

  } catch (error: any) {
    console.error("[YouTube Upload] Error:", error?.response?.data || error);

    // Handle token expiry or missing permissions specifically
    if (
      error.code === 401 || 
      error?.response?.status === 401 || 
      error?.errors?.[0]?.reason === "authError"
    ) {
       return NextResponse.json(
        { error: "YouTube authentication expired or invalid. Please sign out and sign in with Google again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to upload to YouTube" },
      { status: 500 }
    );
  }
}
