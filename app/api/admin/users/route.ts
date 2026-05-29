import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET_USERS_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data user." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "OPERATOR").trim().toUpperCase();

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { message: "Nama, username, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const allowedRoles = ["OWNER", "ADMIN", "OPERATOR", "CASHIER"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Role tidak valid." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau email sudah digunakan." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "User berhasil dibuat.",
      user,
    });
  } catch (error) {
    console.error("CREATE_USER_ERROR:", error);

    return NextResponse.json(
      { message: "Gagal membuat user." },
      { status: 500 }
    );
  }
}