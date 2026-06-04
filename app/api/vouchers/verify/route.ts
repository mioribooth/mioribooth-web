import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveRevenueTransaction } from "@/lib/revenueStore";

const PACKAGE_PRICE = 25000;
const EXTRA_PRINT_PRICE = 5000;

function getLayoutType(packageName: string) {
  const name = String(packageName || "").toUpperCase();

  if (name.includes("4R")) return "4R";

  return "PHOTO_STRIP";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode voucher wajib diisi.",
        },
        { status: 400 }
      );
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          message: "Voucher tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (!voucher.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Voucher tidak aktif.",
        },
        { status: 400 }
      );
    }

    if (voucher.used >= voucher.quota) {
      return NextResponse.json(
        {
          success: false,
          message: "Voucher sudah digunakan.",
        },
        { status: 400 }
      );
    }

    const extraPrint = voucher.extraPrint || 0;
    const totalAmount =
      voucher.price || PACKAGE_PRICE + extraPrint * EXTRA_PRINT_PRICE;

    const layoutType = getLayoutType(voucher.packageName);

    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        used: {
          increment: 1,
        },
      },
    });

    await saveRevenueTransaction({
      transactionId: `TRX-${Date.now()}`,
      paymentMethod: "VOUCHER",
      voucherCode: updatedVoucher.code,
      packageName: updatedVoucher.packageName,
      extraPrint,
      amount: totalAmount,
      paidAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Voucher berhasil digunakan.",
      voucher: {
        code: updatedVoucher.code,
        packageName: updatedVoucher.packageName,
        layoutType,
        packagePrice: PACKAGE_PRICE,
        extraPrint,
        extraPrintPrice: extraPrint * EXTRA_PRINT_PRICE,
        totalAmount,
        status: updatedVoucher.used >= updatedVoucher.quota ? "USED" : "ACTIVE",
        quota: updatedVoucher.quota,
        used: updatedVoucher.used,
        createdAt: updatedVoucher.createdAt,
        usedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("VERIFY_VOUCHER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal verifikasi voucher.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}