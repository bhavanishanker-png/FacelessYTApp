import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    await connectDB();
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the list of connected channels (excluding raw tokens)
    const channels = (user.youtubeChannels || []).map((c: any) => ({
      channelId: c.channelId,
      channelName: c.channelName,
      channelImage: c.channelImage,
      connectedAt: c.connectedAt,
    }));

    return NextResponse.json({ success: true, channels });
  } catch (error: any) {
    console.error("Fetch Channels Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
