import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Student, Exam } from "@/lib/types";

interface StorageData {
  students: Student[];
  exams: Exam[];
}

// 관장님이 알려주신 진짜 금고 주소입니다!
const REAL_BLOB_URL =
  "https://rnr1m58qkw9x0nqt.public.blob.vercel-storage.com/students-data.json";
const BLOB_FILENAME = "students-data.json";
const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "students.json");

async function readData(): Promise<StorageData> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // 이제 엉뚱한 주소가 아닌 진짜 금고 주소에서 데이터를 가져옵니다.
      const response = await fetch(`${REAL_BLOB_URL}?t=${Date.now()}`, {
        cache: "no-store", // 캐시를 사용하지 않고 항상 최신 데이터를 가져옵니다.
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log("Blob read failed:", error);
    }
    return getDefaultData();
  }

  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    const defaultData = getDefaultData();
    await writeDataLocally(defaultData);
    return defaultData;
  }
}

async function writeData(data: StorageData): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false, // 파일명이 바뀌지 않게 고정합니다.
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
  return { students: [], exams: [] };
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
  const body = await req.json();
  const { type, data: payload } = body;
  const current = await readData();
  if (type === "students") current.students = payload;
  else if (type === "exams") current.exams = payload;
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  await writeData(current);
  return NextResponse.json({ success: true });
}
