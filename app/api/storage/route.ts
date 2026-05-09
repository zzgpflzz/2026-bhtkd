import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Student, Exam } from "@/lib/types";

// Vercel이 이 API를 캐싱하지 못하도록 강제 설정 (매우 중요)
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface StorageData {
  students: Student[];
  exams: Exam[];
}

const BLOB_FILENAME = "students-data.json";
const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "students.json");

async function readData(): Promise<StorageData> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list();
      const targetBlob = blobs.find((b) => b.pathname === BLOB_FILENAME);

      if (targetBlob) {
        // 캐시를 완전히 무시하고 항상 '생' 데이터를 가져오도록 헤더 설정
        const response = await fetch(`${targetBlob.url}?t=${Date.now()}`, {
          cache: "no-store",
          next: { revalidate: 0 },
        });
        if (response.ok) {
          const data = await response.json();
          return {
            students: Array.isArray(data.students) ? data.students : [],
            exams: Array.isArray(data.exams) ? data.exams : [],
          };
        }
      }
    } catch (error) {
      console.error("금고 읽기 실패:", error);
    }
  }

  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { students: [], exams: [] };
  }
}

async function writeData(data: StorageData): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_FILENAME, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return;
  }
  const dir = path.dirname(LOCAL_DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const data = await readData();
  return NextResponse.json(
    type === "students" ? data.students : type === "exams" ? data.exams : data,
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data: payload } = body;
  const current = await readData();
  if (type === "students") current.students = payload;
  else if (type === "exams") current.exams = payload;
  await writeData(current);
  return NextResponse.json({ success: true });
}
