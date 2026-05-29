import { NextResponse } from "next/server";
import { saveVoucher } from "@/lib/voucherStore";

function generateVoucherCode() {
  return Math.floor(
    1000 + Math.random() * 9000
  ).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = generateVoucherCode();

    await saveVoucher({
      code,
      packageName: body.packageName,
      packagePrice: body.packagePrice,
      extraPrint: body.extraPrint,
      extraPrintPrice: body.extraPrintPrice,
      totalAmount: body.totalAmount,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      code,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}