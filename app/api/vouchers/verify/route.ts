import { NextResponse } from "next/server";
import { getVoucher } from "@/lib/voucherStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const voucher = await getVoucher(body.code);

    if (!voucher) {
      return NextResponse.json({
        success: false,
        message: "Voucher tidak ditemukan",
      });
    }

    if (voucher.status === "USED") {
      return NextResponse.json({
        success: false,
        message: "Voucher sudah digunakan",
      });
    }

    return NextResponse.json({
      success: true,
      voucher,
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