import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PACKAGE_PRICE = 25000;
const EXTRA_PRINT_PRICE = 5000;

function generateFourDigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateUniqueVoucherCode() {
  let code = generateFourDigitCode();

  for (let i = 0; i < 20; i++) {
    const existing = await prisma.voucher.findUnique({
      where: { code },
    });

    if (!existing) return code;

    code = generateFourDigitCode();
  }

  throw new Error("Gagal generate kode voucher unik.");
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

    const packageName = String(body.packageName || "").trim();
    const quota = Number(body.quota || 1);
    const extraPrint = Number(body.extraPrint || 0);
    const price = PACKAGE_PRICE + extraPrint * EXTRA_PRINT_PRICE;

    if (!packageName) {
      return NextResponse.json(
        { message: "Paket wajib dipilih." },
        { status: 400 }
      );
    }

    const code = await generateUniqueVoucherCode();

    const voucher = await prisma.voucher.create({
      data: {
        code,
        name: `${packageName} Voucher`,
        packageName,
        quota,
        used: 0,
        price,
        extraPrint,
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