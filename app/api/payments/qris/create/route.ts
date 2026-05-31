import { NextResponse } from "next/server";
import { createDokuQris } from "@/lib/doku";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = Number(body.amount || 25000);
    const transactionId =
      String(body.transactionId || "").trim() || `MIORI-${Date.now()}`;

    const qris = await createDokuQris({
      amount,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      qris,
      qrContent: qris.qrContent,
      referenceNo: qris.referenceNo,
      partnerReferenceNo: qris.partnerReferenceNo,
    });
  } catch (error) {
    console.error("CREATE_QRIS_API_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat QRIS.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}