import { NextResponse } from "next/server";
import { sessions } from "@/lib/sessionStore";

type Params = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: Params) {
  const { sessionId } = await context.params;

  const session = sessions.get(sessionId);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Session tidak ditemukan",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    session,
  });
}