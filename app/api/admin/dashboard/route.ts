import { NextResponse } from "next/server";
import { getRecentRevenueTransactions } from "@/lib/revenueStore";
import { getVoucherStats } from "@/lib/voucherStore";

function isSameDay(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function getLast7DaysChart(transactions: any[]) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    const label = date.toLocaleDateString("id-ID", {
      weekday: "short",
    });

    const revenue = transactions
      .filter((trx) => isSameDay(new Date(trx.paidAt), date))
      .reduce((sum, trx) => sum + trx.amount, 0);

    return {
      label,
      revenue,
    };
  });

  const maxRevenue = Math.max(...days.map((day) => day.revenue), 1);

  return days.map((day) => ({
    ...day,
    percent: Math.round((day.revenue / maxRevenue) * 100),
  }));
}

export async function GET() {
  try {
    const transactions = await getRecentRevenueTransactions(500);
    const voucherStats = await getVoucherStats();
    const now = new Date();

    const todayTransactions = transactions.filter((trx) =>
      isSameDay(new Date(trx.paidAt), now)
    );

    const weekTransactions = transactions.filter((trx) =>
      isThisWeek(new Date(trx.paidAt), now)
    );

    const monthTransactions = transactions.filter((trx) =>
      isSameMonth(new Date(trx.paidAt), now)
    );

    const qrisTransactions = transactions.filter(
      (trx) => trx.paymentMethod === "QRIS"
    );

    const voucherTransactions = transactions.filter(
      (trx) => trx.paymentMethod === "VOUCHER"
    );

    const cashTransactions = transactions.filter(
      (trx) => trx.paymentMethod === "CASH"
    );

    return NextResponse.json({
      success: true,
      summary: {
        todayRevenue: todayTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),
        weekRevenue: weekTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),
        monthRevenue: monthTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),
        totalTransactions: transactions.length,

        todayTransactions: todayTransactions.length,
        weekTransactions: weekTransactions.length,
        monthTransactions: monthTransactions.length,

        qrisRevenue: qrisTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),
        voucherRevenue: voucherTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),
        cashRevenue: cashTransactions.reduce(
          (sum, trx) => sum + trx.amount,
          0
        ),

        qrisCount: qrisTransactions.length,
        voucherCount: voucherTransactions.length,
        cashCount: cashTransactions.length,

        voucherActive: voucherStats.active,
        voucherUsed: voucherStats.used,
        voucherTotal: voucherStats.total,
      },
      chart: getLast7DaysChart(transactions),
      transactions: transactions.slice(0, 25),
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