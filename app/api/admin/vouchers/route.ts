import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateVoucherCode() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MIORI-${random}`;
}

export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ vouchers });
  } catch (error) {
    console.error("GET_VOUCHERS_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data voucher." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const packageName = String(body.packageName || "").trim();
    const quota = Number(body.quota || 1);
    const price = Number(body.price || 0);
    const customCode = String(body.code || "").trim().toUpperCase();

    if (!name || !packageName) {
      return NextResponse.json(
        { message: "Nama voucher dan paket wajib diisi." },
        { status: 400 }
      );
    }

    const code = customCode || generateVoucherCode();

    const existingVoucher = await prisma.voucher.findUnique({
      where: { code },
    });

    if (existingVoucher) {
      return NextResponse.json(
        { message: "Kode voucher sudah digunakan." },
        { status: 409 }
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        code,
        name,
        packageName,
        quota,
        price,
        used: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Voucher berhasil dibuat.",
      voucher,
    });
  } catch (error) {
    console.error("CREATE_VOUCHER_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal membuat voucher." },
      { status: 500 }
    );
  }
}