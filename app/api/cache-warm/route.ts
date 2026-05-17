import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron이나 외부에서 호출하여 캐시 warming
export async function GET() {
  try {
    const db = getAdminDb();

    // Students와 Exams를 병렬로 조회
    const [studentsSnap, examsSnap] = await Promise.all([
      db.collection("students").get(),
      db.collection("exams").get(),
    ]);

    const students = studentsSnap.docs.map((d) => d.data());
    const exams = examsSnap.docs.map((d) => d.data());

    return NextResponse.json({
      ok: true,
      cached: {
        students: students.length,
        exams: exams.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("[cache-warm]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
