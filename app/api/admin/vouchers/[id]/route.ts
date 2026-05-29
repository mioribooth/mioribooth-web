import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        name: body.name,
        packageName: body.packageName,
        quota:
          body.quota === undefined || body.quota === ""
            ? undefined
            : Number(body.quota),
        price:
          body.price === undefined || body.price === ""
            ? undefined
            : Number(body.price),
        isActive:
          body.isActive === undefined ? undefined : Boolean(body.isActive),
      },
    });

    return NextResponse.json({
      message: "Voucher berhasil diperbarui.",
      voucher,
    });
  } catch (error) {
    console.error("UPDATE_VOUCHER_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui voucher." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Voucher berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE_VOUCHER_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menghapus voucher." },
      { status: 500 }
    );
  }
}