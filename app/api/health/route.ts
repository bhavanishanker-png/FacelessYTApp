import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", detail: "DB unreachable" }, { status: 500 });
  }
}
