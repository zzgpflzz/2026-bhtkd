import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import type { Student, Exam } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get("type");

    // 데이터베이스에서 학생/심사 정보를 가져옵니다.
    const students = (await kv.get<Student[]>("students")) || [];
    const exams = (await kv.get<Exam[]>("exams")) || [];

    if (type === "students") return NextResponse.json(students);
    if (type === "exams") return NextResponse.json(exams);
    return NextResponse.json({ students, exams });
  } catch (error) {
    return NextResponse.json({ students: [], exams: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, data: payload } = await req.json();

    // 데이터베이스에 즉시 저장 (파일 방식이 아니라서 절대 안 꼬입니다.)
    await kv.set(type, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "DB 저장 실패" }, { status: 500 });
  }
}
