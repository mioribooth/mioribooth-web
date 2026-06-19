import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBookkeepingTransaction } from "@/lib/bookkeeping";

const INDONESIA_UTC_OFFSET_HOURS = 8;

function indonesiaDateParts(date = new Date()) {
  const local = new Date(date.getTime() + INDONESIA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
}

function indonesiaDateOnlyToUtc(dateOnly: string, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    hour - INDONESIA_UTC_OFFSET_HOURS,
    minute,
    second,
    millisecond
  ));
}

function indonesiaDateOnlyToNoonUtc(dateOnly: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day, 12 - INDONESIA_UTC_OFFSET_HOURS, 0, 0, 0));
}

function startOfIndonesiaDay(date = new Date()) {
  const parts = indonesiaDateParts(date);
  return indonesiaDateOnlyToUtc(
    `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
  )!;
}

function startOfIndonesiaMonth(date = new Date()) {
  const parts = indonesiaDateParts(date);
  return indonesiaDateOnlyToUtc(
    `${parts.year}-${String(parts.month).padStart(2, "0")}-01`
  )!;
}

function getDateRange(searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from && !to) return undefined;

  const range: { gte?: Date; lte?: Date } = {};

  if (from) {
    const start = indonesiaDateOnlyToUtc(from);
    if (start) range.gte = start;
  }

  if (to) {
    const end = indonesiaDateOnlyToUtc(to, true);
    if (end) range.lte = end;
  }

  return range;
}

function summarize(transactions: Array<{ type: string; amount: number }>) {
  const income = transactions
    .filter((trx) => trx.type === "INCOME")
    .reduce((sum, trx) => sum + trx.amount, 0);

  const expense = transactions
    .filter((trx) => trx.type === "EXPENSE")
    .reduce((sum, trx) => sum + trx.amount, 0);

  return {
    income,
    expense,
    profit: income - expense,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const source = searchParams.get("source");
    const dateRange = getDateRange(searchParams);

    const where: any = {};

    if (type === "INCOME" || type === "EXPENSE") where.type = type;
    if (source === "AUTO" || source === "MANUAL") where.source = source;
    if (dateRange) where.createdAt = dateRange;

    const [transactions, todayTransactions, monthTransactions] = await Promise.all([
      prisma.bookkeepingTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.bookkeepingTransaction.findMany({
        where: {
          createdAt: {
            gte: startOfIndonesiaDay(new Date()),
          },
        },
      }),
      prisma.bookkeepingTransaction.findMany({
        where: {
          createdAt: {
            gte: startOfIndonesiaMonth(new Date()),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        filtered: summarize(transactions),
        today: summarize(todayTransactions),
        month: summarize(monthTransactions),
      },
      transactions,
    });
  } catch (error) {
    console.error("GET_BOOKKEEPING_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pembukuan.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type || "").toUpperCase();
    const category = String(body.category || "").trim();
    const method = String(body.method || "OTHER").toUpperCase();
    const amount = Number(body.amount || 0);
    const description = String(body.description || "").trim();
    const source = String(body.source || "MANUAL").toUpperCase();
    const transactionDate = typeof body.transactionDate === "string" ? body.transactionDate : "";
    const createdAt = transactionDate ? indonesiaDateOnlyToNoonUtc(transactionDate) : null;

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json(
        { success: false, message: "Jenis transaksi tidak valid." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kategori wajib diisi." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal wajib lebih dari 0." },
        { status: 400 }
      );
    }

    const transaction = await saveBookkeepingTransaction({
      type,
      source: source === "AUTO" ? "AUTO" : "MANUAL",
      category,
      method,
      amount,
      description,
      sessionId: body.sessionId ? String(body.sessionId) : null,
      createdAt,
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi pembukuan berhasil disimpan.",
      transaction,
    });
  } catch (error) {
    console.error("CREATE_BOOKKEEPING_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan transaksi pembukuan.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
