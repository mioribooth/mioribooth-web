import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      file,
      folder = "miori-booth",
      resourceType = "image",
    } = body;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "File tidak ditemukan",
        },
        { status: 400 }
      );
    }

    const uploadResult = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: resourceType,
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Upload gagal",
        error: String(error),
      },
      { status: 500 }
    );
  }
}