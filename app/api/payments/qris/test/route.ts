import { NextResponse } from "next/server";
import { createDokuQris } from "@/lib/doku";

export async function GET() {
  try {
    const qris = await createDokuQris({
      amount: 1000,
      transactionId: `MIORI-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      qris,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}