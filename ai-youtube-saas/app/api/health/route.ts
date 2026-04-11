import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    // You can optionally connect to DB here by calling await connectDB() 
    // to test the connection if needed, but for a simple health check 
    // we just return a status object.
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
