import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Student, Exam } from "@/lib/types";

interface StorageData {
  students: Student[];
  exams: Exam[];
}

// 1. 관장님의 실제 금고(Blob) 주소입니다.
const REAL_BLOB_URL =
  "https://rnr1m58qkw9x0nqt.public.blob.vercel-storage.com/students-data.json";
const BLOB_FILENAME = "students-data.json";
const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "students.json");

// 데이터를 읽어오는 함수
async function readData(): Promise<StorageData> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // ?t=... 를 붙여서 브라우저가 예전 목업 데이터를 기억하지 못하게 강제로 새 데이터를 가져옵니다.
      const response = await fetch(`${REAL_BLOB_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log("Blob read failed, using default data:", error);
    }
    return getDefaultData();
  }

  // 로컬 환경
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    const defaultData = getDefaultData();
    await writeDataLocally(defaultData);
    return defaultData;
  }
}

// 데이터를 금고에 저장하는 함수
async function writeData(data: StorageData): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // addRandomSuffix: false 를 써야 파일명이 바뀌지 않고 'students-data.json' 하나에 계속 덮어씁니다.
      await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
      return;
    } catch (error) {
      console.error("Blob write failed:", error);
      throw error;
    }
  }
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
