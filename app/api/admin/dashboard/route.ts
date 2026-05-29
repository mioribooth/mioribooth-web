import { NextResponse } from "next/server";
import { getRecentRevenueTransactions } from "@/lib/revenueStore";

function isSameDay(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameMonth(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

export async function GET() {
  try {
    const transactions = await getRecentRevenueTransactions(300);
    const now = new Date();

    const todayRevenue = transactions
      .filter((trx) => isSameDay(new Date(trx.paidAt), now))
      .reduce((sum, trx) => sum + trx.amount, 0);

    const weekRevenue = transactions
      .filter((trx) => isThisWeek(new Date(trx.paidAt), now))
      .reduce((sum, trx) => sum + trx.amount, 0);

    const monthRevenue = transactions
      .filter((trx) => isSameMonth(new Date(trx.paidAt), now))
      .reduce((sum, trx) => sum + trx.amount, 0);

    return NextResponse.json({
      success: true,
      summary: {
        todayRevenue,
        weekRevenue,
        monthRevenue,
        totalTransactions: transactions.length,
      },
      transactions: transactions.slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil dashboard",
        error: String(error),
      },
      { status: 500 }
    );
  }
}