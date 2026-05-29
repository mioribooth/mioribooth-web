import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const usernameOrEmail = String(body.usernameOrEmail || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        {
          message: "Username/email dan password wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: usernameOrEmail,
          },
          {
            email: usernameOrEmail,
          },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Akun tidak ditemukan.",
        },
        {
          status: 401,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          message: "Password salah.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      message: "Login berhasil.",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan server.",
      },
      {
        status: 500,
      }
    );
  }
}