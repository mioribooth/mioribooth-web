import { queryDokuQris } from "@/lib/doku";

function isPaidStatus(data: any) {
  const status =
    data?.transactionStatusDesc ||
    data?.latestTransactionStatus ||
    data?.transactionStatus ||
    data?.status ||
    "";

  const normalized = String(status).toUpperCase();

  return (
    normalized === "SUCCESS" ||
    normalized === "PAID" ||
    normalized === "SETTLEMENT" ||
    normalized === "00" ||
    normalized.includes("SUCCESS") ||
    normalized.includes("PAID")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const partnerReferenceNo =
      typeof body.partnerReferenceNo === "string" && body.partnerReferenceNo.trim()
        ? body.partnerReferenceNo.trim()
        : "";

    const referenceNo =
      typeof body.referenceNo === "string" && body.referenceNo.trim()
        ? body.referenceNo.trim()
        : "";

    if (!partnerReferenceNo) {
      return Response.json(
        {
          success: false,
          paid: false,
          error: "partnerReferenceNo wajib diisi.",
        },
        { status: 400 }
      );
    }

    const data = await queryDokuQris({
      originalPartnerReferenceNo: partnerReferenceNo,
      originalReferenceNo: referenceNo || partnerReferenceNo,
    });

    return Response.json({
      success: true,
      paid: isPaidStatus(data),
      data,
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        paid: false,
        error: err.message || "Gagal cek status QRIS.",
      },
      { status: 500 }
    );
  }
}
