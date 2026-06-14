import { createDokuQris } from "@/lib/doku";

export async function GET() {
  try {
    const transactionId = `MIORI-${Date.now()}`;

    const data = await createDokuQris({
      amount: 25000,
      transactionId,
    });

    return Response.json({
      success: true,
      transactionId,
      data,
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    });
  }
}