import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema, type LoginData } from "@/validation/validator";
import { createSession, setSessionCookie } from "@/lib/session";

export const loginUserService = async (data: LoginData) => {
  // Find user by unique field (email)
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new Error("User is not verified. Please complete verification first.");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Return sanitized user object (no password)
  const { password, ...safeUser } = user;
  return safeUser;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data: LoginData = validation.data;

    const user = await loginUserService(data);

    const sessionId = await createSession(user);
    await setSessionCookie(sessionId);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}