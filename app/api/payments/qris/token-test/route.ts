import { NextResponse } from "next/server";
import { getDokuAccessToken } from "@/lib/doku";

export async function GET() {
  try {
    const token = await getDokuAccessToken();

    return NextResponse.json({
  success: true,
  tokenLength: token.length,
});
  } catch (error) {
    console.error("DOKU_TOKEN_TEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}