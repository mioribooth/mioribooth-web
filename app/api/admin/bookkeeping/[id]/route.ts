import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const type = String(body.type || "").toUpperCase();
    const amount = Number(body.amount || 0);

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json(
        { success: false, message: "Jenis transaksi tidak valid." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal wajib lebih dari 0." },
        { status: 400 }
      );
    }

    const transaction = await prisma.bookkeepingTransaction.update({
      where: { id },
      data: {
        type,
        category: String(body.category || "").trim(),
        method: body.method ? String(body.method).toUpperCase() : null,
        amount: Math.round(amount),
        description: body.description ? String(body.description).trim() : null,
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("UPDATE_BOOKKEEPING_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengubah transaksi pembukuan." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.bookkeepingTransaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi pembukuan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE_BOOKKEEPING_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus transaksi pembukuan." },
      { status: 500 }
    );
  }
}
