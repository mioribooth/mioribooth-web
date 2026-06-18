import { createDokuQris } from "@/lib/doku";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const amount = Number(body.amount || 0);
    const transactionId =
      typeof body.transactionId === "string" && body.transactionId.trim()
        ? body.transactionId.trim()
        : `MIORI-${Date.now()}`;

    if (!amount || amount <= 0) {
      return Response.json(
        {
          success: false,
          error: "Amount tidak valid.",
        },
        { status: 400 }
      );
    }

    const data = await createDokuQris({
      amount,
      transactionId,
    });

    return Response.json({
      success: true,
      transactionId,
      data,
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err.message || "Gagal membuat QRIS.",
      },
      { status: 500 }
    );
  }
}
