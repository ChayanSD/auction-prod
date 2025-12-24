import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/session";

export async function POST(): Promise<NextResponse> {
  try {
    await deleteSession();
    await clearSessionCookie();
    return NextResponse.json({ success: true } , { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}