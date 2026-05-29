import { redis } from "@/lib/redis";

export type VoucherData = {
  code: string;
  packageName: string;
  packagePrice: number;
  extraPrint: number;
  extraPrintPrice: number;
  totalAmount: number;
  status: "ACTIVE" | "USED";
  createdAt: string;
  usedAt?: string;
};

export async function saveVoucher(voucher: VoucherData) {
  await redis.set(`voucher:${voucher.code}`, voucher);
}

export async function getVoucher(code: string) {
  return redis.get<VoucherData>(`voucher:${code}`);
}

export async function markVoucherUsed(code: string) {
  const voucher = await getVoucher(code);

  if (!voucher) {
    return null;
  }

  const updatedVoucher: VoucherData = {
    ...voucher,
    status: "USED",
    usedAt: new Date().toISOString(),
  };

  await saveVoucher(updatedVoucher);

  return updatedVoucher;
}