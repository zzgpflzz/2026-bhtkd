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

// 데이터를 읽어오는 로직 강화
async function readData(): Promise<StorageData> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list();
      // 가장 최근에 업데이트된 students-data.json 파일을 찾습니다.
      const targetBlob = blobs.find((b) => b.pathname === BLOB_FILENAME);

      if (targetBlob) {
        const response = await fetch(`${targetBlob.url}?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (response.ok) {
          const data = await response.json();
          // 데이터 구조가 올바른지 확인 후 반환
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

  // 로컬 환경 혹은 금고가 비었을 때
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { students: [], exams: [] };
  }
}

async function writeData(data: StorageData): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // 금고에 저장 (무조건 덮어쓰기 설정)
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

  if (type === "students") return NextResponse.json(data.students);
  if (type === "exams") return NextResponse.json(data.exams);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data: payload } = body;

    // 1. 저장하기 전에 금고에서 현재 데이터를 다시 한번 확실히 불러옵니다.
    const current = await readData();

    // 2. 불러온 데이터에 새 내용을 업데이트합니다.
    if (type === "students") {
      current.students = payload;
    } else if (type === "exams") {
      current.exams = payload;
    }

    // 3. 업데이트된 전체 명단을 금고에 다시 넣습니다.
    await writeData(current);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
