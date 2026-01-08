import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase().trim()),
  otp: z.string()
    .min(4, "OTP must be 4 digits")
    .max(4, "OTP must be 4 digits")
    .regex(/^\d{4}$/, "OTP must be exactly 4 digits")
    .transform((val) => val.trim()),
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP for password reset
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = verifyOTPSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    // Email is already normalized by the schema transform
    // Get OTP from Redis
    const redisKey = `forgot-password:${email}`;
    const storedOTP = await redis.get(redisKey);

    if (!storedOTP) {
      console.log('OTP not found in Redis:', { redisKey, email });
      return NextResponse.json(
        { error: "OTP has expired or is invalid. Please request a new one." },
        { status: 400 }
      );
    }

    // Convert stored OTP to string
    // Upstash Redis returns values as strings when stored as strings
    let storedOTPString: string;
    if (typeof storedOTP === 'string') {
      storedOTPString = storedOTP.trim();
    } else if (typeof storedOTP === 'number') {
      // If Redis returns a number (shouldn't happen, but handle it)
      storedOTPString = String(storedOTP).padStart(4, '0');
    } else {
      // Fallback: convert to string
      storedOTPString = String(storedOTP).trim();
    }

    // Ensure stored OTP is exactly 4 digits (remove any extra characters)
    storedOTPString = storedOTPString.replace(/\D/g, '').slice(0, 4).padStart(4, '0');

    // OTP from validation is already trimmed and validated to be 4 digits
    const providedOTPString = otp.trim();

    // Debug logging with detailed comparison
    console.log('OTP Verification Debug:', {
      email: email,
      redisKey: redisKey,
      storedOTPType: typeof storedOTP,
      storedOTPRaw: JSON.stringify(storedOTP),
      storedOTPString: storedOTPString,
      storedOTPLength: storedOTPString.length,
      storedOTPCharCodes: storedOTPString.split('').map(c => c.charCodeAt(0)),
      providedOTPType: typeof otp,
      providedOTPRaw: JSON.stringify(otp),
      providedOTPString: providedOTPString,
      providedOTPLength: providedOTPString.length,
      providedOTPCharCodes: providedOTPString.split('').map(c => c.charCodeAt(0)),
      exactMatch: storedOTPString === providedOTPString,
      afterTrimMatch: storedOTPString.trim() === providedOTPString.trim(),
    });

    // Compare the OTPs (strict comparison)
    if (storedOTPString !== providedOTPString) {
      console.error('OTP Mismatch:', {
        stored: `"${storedOTPString}"`,
        provided: `"${providedOTPString}"`,
        storedLength: storedOTPString.length,
        providedLength: providedOTPString.length,
      });
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP is valid - create a reset token that will be used for password reset
    // Store reset token in Redis for 10 minutes (600 seconds)
    const resetToken = crypto.randomUUID();
    const resetTokenKey = `reset-token:${email}`; // email is already normalized
    await redis.set(resetTokenKey, resetToken, { ex: 600 });

    // Delete the OTP after successful verification
    await redis.del(redisKey);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

