import { getDokuAccessToken } from "@/lib/doku";

export async function GET() {
  try {
    const token = await getDokuAccessToken();

    return Response.json({
      success: true,
      token,
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    });
  }
}