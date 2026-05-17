import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// base64 이미지를 Firebase Storage에 업로드하고 public URL 반환
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dataUrl, studentId } = body;

    if (!dataUrl || !studentId) {
      return NextResponse.json(
        { error: "dataUrl and studentId are required" },
        { status: 400 }
      );
    }

    // base64 데이터 파싱
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid data URL format" },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Firebase Storage에 업로드
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileName = `students/${studentId}/photo.jpg`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
      public: true, // 공개 URL 생성
    });

    // 공개 URL 생성
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("[API upload]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
