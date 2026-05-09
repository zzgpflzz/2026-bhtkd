import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Student, Exam } from "@/lib/types";

interface StorageData {
  students: Student[];
  exams: Exam[];
}

const BLOB_FILENAME = "students-data.json";
const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "students.json");

// Vercel Blob 또는 로컬 파일에서 데이터 읽기
async function readData(): Promise<StorageData> {
  // Vercel 환경 (BLOB_READ_WRITE_TOKEN이 있을 때)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobUrl = `https://${process.env.VERCEL_URL || "localhost"}/.well-known/vercel/blob/${BLOB_FILENAME}`;
      const response = await fetch(blobUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log("Blob read failed, using default data:", error);
    }
    // Blob에 데이터가 없으면 초기 데이터 반환
    return getDefaultData();
  }

  // 로컬 개발 환경
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    // 로컬 파일이 없으면 초기 데이터 생성
    const defaultData = getDefaultData();
    await writeDataLocally(defaultData);
    return defaultData;
  }
}

// Vercel Blob 또는 로컬 파일에 데이터 쓰기
async function writeData(data: StorageData): Promise<void> {
  // Vercel 환경
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
        access: "public",
        contentType: "application/json",
      });
      return;
    } catch (error) {
      console.error("Blob write failed:", error);
      throw error;
    }
  }

  // 로컬 개발 환경
  await writeDataLocally(data);
}

async function writeDataLocally(data: StorageData): Promise<void> {
  const dir = path.dirname(LOCAL_DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getDefaultData(): StorageData {
  return {
    students: [],
    exams: [],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const data = await readData();

  if (type === "students") {
    return NextResponse.json(data.students);
  } else if (type === "exams") {
    return NextResponse.json(data.exams);
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data: payload } = body;

  const current = await readData();

  if (type === "students") {
    current.students = payload;
  } else if (type === "exams") {
    current.exams = payload;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  await writeData(current);
  return NextResponse.json({ success: true });
}
