import { redis } from "@/lib/redis";

export type RevenueTransaction = {
  transactionId: string;
  paymentMethod: "QRIS" | "VOUCHER" | "CASH";
  voucherCode?: string;
  packageName: string;
  extraPrint: number;
  amount: number;
  paidAt: string;
};

export async function saveRevenueTransaction(
  transaction: RevenueTransaction
) {
  await redis.set(
    `transaction:${transaction.transactionId}`,
    transaction
  );

  await redis.zadd("revenue:transactions", {
    score: new Date(transaction.paidAt).getTime(),
    member: transaction.transactionId,
  });
}

export async function getRecentRevenueTransactions(
  limit = 100
) {
  const transactionIds = await redis.zrange<string[]>(
    "revenue:transactions",
    0,
    limit - 1,
    {
      rev: true,
    }
  );

  const transactions = await Promise.all(
    transactionIds.map((id) =>
      redis.get<RevenueTransaction>(
        `transaction:${id}`
      )
    )
  );

  return transactions.filter(
    Boolean
  ) as RevenueTransaction[];
}