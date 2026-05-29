import { NextResponse } from "next/server";
import { getVoucher, markVoucherUsed } from "@/lib/voucherStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim();

    if (!code) {
      return NextResponse.json({
        success: false,
        message: "Kode voucher wajib diisi",
      });
    }

    const voucher = await getVoucher(code);

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

    const updatedVoucher = await markVoucherUsed(voucher.code);

    return NextResponse.json({
      success: true,
      voucher: updatedVoucher,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal verifikasi voucher",
        error: String(error),
      },
      { status: 500 }
    );
  }
}