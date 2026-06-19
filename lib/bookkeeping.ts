import { prisma } from "@/lib/prisma";

export type BookkeepingType = "INCOME" | "EXPENSE";
export type BookkeepingSource = "AUTO" | "MANUAL";

export async function saveBookkeepingTransaction(data: {
  type: BookkeepingType;
  source?: BookkeepingSource;
  category: string;
  method?: string | null;
  amount: number;
  description?: string | null;
  sessionId?: string | null;
  createdAt?: Date | null;
}) {
  const amount = Math.round(Number(data.amount || 0));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal transaksi pembukuan tidak valid.");
  }

  return prisma.bookkeepingTransaction.create({
    data: {
      type: data.type,
      source: data.source || "MANUAL",
      category: data.category,
      method: data.method || null,
      amount,
      description: data.description || null,
      sessionId: data.sessionId || null,
      ...(data.createdAt ? { createdAt: data.createdAt } : {}),
    },
  });
}
