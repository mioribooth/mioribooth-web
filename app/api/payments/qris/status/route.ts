import { queryDokuQris } from "@/lib/doku";
import { prisma } from "@/lib/prisma";
import { saveBookkeepingTransaction } from "@/lib/bookkeeping";

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

    const paid = isPaidStatus(data);

    if (paid) {
      const amountFromBody = Number(body.amount || body.totalAmount || 0);
      const amountFromResponse = Number(
        data?.amount?.value || data?.paidAmount?.value || data?.totalAmount || 0
      );
      const amount = amountFromBody || amountFromResponse;

      if (amount > 0) {
        const existing = await prisma.bookkeepingTransaction.findFirst({
          where: {
            source: "AUTO",
            method: "QRIS",
            sessionId: partnerReferenceNo,
          },
        });

        if (!existing) {
          await saveBookkeepingTransaction({
            type: "INCOME",
            source: "AUTO",
            category: body.category ? String(body.category) : "Photobooth",
            method: "QRIS",
            amount,
            description: body.packageName
              ? `${body.packageName}${body.extraPrint ? ` - Extra print ${body.extraPrint}` : ""}`
              : "Pembayaran QRIS photobooth",
            sessionId: partnerReferenceNo,
          });
        }
      }
    }

    return Response.json({
      success: true,
      paid,
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
