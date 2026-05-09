import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Student, Exam } from "@/lib/types";

interface StorageData {
  students: Student[];
  exams: Exam[];
}

const BLOB_FILENAME = "students-data.json";
const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "students.json");

async function readData(): Promise<StorageData> {
  // Vercel 환경
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // 주소를 직접 적지 않고, 금고 안에서 'students-data.json'이라는 이름을 가진 파일을 찾아옵니다.
      const { blobs } = await list();
      const targetBlob = blobs.find((b) => b.pathname === BLOB_FILENAME);

      if (targetBlob) {
        const response = await fetch(`${targetBlob.url}?t=${Date.now()}`, {
          cache: "no-store",
        });
        return await response.json();
      }
    } catch (error) {
      console.error("Blob read error:", error);
    }
    return { students: [], exams: [] }; // 아무것도 없으면 목업 대신 빈 배열 반환
  }

  // 로컬 환경
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
      addRandomSuffix: false, // 파일명 뒤에 난수 붙이지 않음
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
