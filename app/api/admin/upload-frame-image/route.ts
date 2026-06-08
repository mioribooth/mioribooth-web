import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body.image;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, message: "Image wajib dikirim." },
        { status: 400 }
      );
    }

    const uploaded = await cloudinary.uploader.upload(image, {
      folder: "miori-booth/frames",
      resource_type: "image",
      overwrite: false,
    });

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    console.error("UPLOAD_FRAME_IMAGE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal upload frame ke Cloudinary." },
      { status: 500 }
    );
  }
}
