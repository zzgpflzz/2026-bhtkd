import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// Firestore REST API 설정
// ─────────────────────────────────────────────
const FIREBASE_CONFIG = {
  projectId: "bhtkd-37f39",
  apiKey: "AIzaSyCM9Ph-47dtlMjLSordkd8ptz8mQsN6b7s",
};

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// JavaScript ↔ Firestore 필드 변환
// ─────────────────────────────────────────────
function toValue(v: unknown): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toValue) } };
  }
  if (typeof v === "object") {
    return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
  }
  return { stringValue: String(v) };
}

function toFields(obj: Record<string, unknown>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toValue(v);
  return fields;
}

function fromValue(v: any): any {
  if (v == null) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.mapValue) return fromFields(v.mapValue.fields ?? {});
  if (v.arrayValue) {
    return (v.arrayValue.values ?? []).map((item: any) => fromValue(item));
  }
  return null;
}

function fromFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields ?? {})) obj[k] = fromValue(v);
  return obj;
}

// ─────────────────────────────────────────────
// 컬렉션 단위 헬퍼
// ─────────────────────────────────────────────
async function listCollection(collection: string): Promise<any[]> {
  const results: any[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/${collection}`);
    url.searchParams.set("key", FIREBASE_CONFIG.apiKey);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.status === 404) return results; // 컬렉션 없음 = 빈 배열
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Firestore LIST ${collection} ${res.status} ${txt}`);
    }
    const json = await res.json();
    for (const doc of json.documents ?? []) {
      results.push(fromFields(doc.fields ?? {}));
    }
    pageToken = json.nextPageToken;
  } while (pageToken);

  return results;
}

async function setDoc(collection: string, id: string, data: Record<string, unknown>) {
  const url = `${BASE}/${collection}/${encodeURIComponent(id)}?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore SET ${collection}/${id} ${res.status} ${txt}`);
  }
  return res.json();
}

async function deleteDoc(collection: string, id: string) {
  const url = `${BASE}/${collection}/${encodeURIComponent(id)}?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const txt = await res.text();
    throw new Error(`Firestore DELETE ${collection}/${id} ${res.status} ${txt}`);
  }
}

// 학생 삭제 시 해당 학생의 exams도 함께 삭제
async function deleteStudentCascade(studentId: string) {
  await deleteDoc("students", studentId);
  const exams = await listCollection("exams");
  const targets = exams.filter((e: any) => e?.studentId === studentId);
  if (targets.length === 0) return;
  await Promise.all(targets.map((e: any) => deleteDoc("exams", e.id)));
}

// ─────────────────────────────────────────────
// 1회 마이그레이션: data/taekwondo 단일 문서 → 컬렉션
// ─────────────────────────────────────────────
let migrationAttempted = false;

async function ensureMigrated() {
  if (migrationAttempted) return;
  migrationAttempted = true;

  try {
    // 새 컬렉션에 이미 데이터가 있으면 마이그레이션 불필요
    const studentsCol = await listCollection("students");
    if (studentsCol.length > 0) return;

    // 기존 단일 문서 시도
    const url = `${BASE}/data/taekwondo?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const doc = await res.json();
    if (!doc?.fields) return;

    const students = (doc.fields.students?.arrayValue?.values ?? []).map(
      (item: any) => fromFields(item.mapValue?.fields ?? {}),
    );
    const exams = (doc.fields.exams?.arrayValue?.values ?? []).map(
      (item: any) => fromFields(item.mapValue?.fields ?? {}),
    );

    console.log(
      `[migration] copying ${students.length} students, ${exams.length} exams to collections`,
    );

    await Promise.all([
      ...students
        .filter((s: any) => s?.id)
        .map((s: any) => setDoc("students", s.id, s)),
      ...exams
        .filter((e: any) => e?.id)
        .map((e: any) => setDoc("exams", e.id, e)),
    ]);
    console.log("[migration] complete");
  } catch (e) {
    console.error("[migration] failed:", e);
    migrationAttempted = false; // 다음 요청에서 다시 시도
  }
}

// ─────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  try {
    await ensureMigrated();

    if (type === "students") {
      const list = await listCollection("students");
      console.log(
        `[API GET students] ${list.length} docs · ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return NextResponse.json(list);
    }
    if (type === "exams") {
      const list = await listCollection("exams");
      console.log(
        `[API GET exams] ${list.length} docs · ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return NextResponse.json(list);
    }
    const [students, exams] = await Promise.all([
      listCollection("students"),
      listCollection("exams"),
    ]);
    return NextResponse.json({ students, exams });
  } catch (e) {
    console.error("[API GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 단건 upsert: PUT /api/storage?type=students&id=xxx
export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  if (!type || !id || (type !== "students" && type !== "exams")) {
    return NextResponse.json(
      { error: "type(students|exams) and id are required" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || body.id !== id) {
      return NextResponse.json(
        { error: "Body must include matching id" },
        { status: 400 },
      );
    }
    await setDoc(type, id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API PUT]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 단건 삭제: DELETE /api/storage?type=students&id=xxx
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  if (!type || !id || (type !== "students" && type !== "exams")) {
    return NextResponse.json(
      { error: "type(students|exams) and id are required" },
      { status: 400 },
    );
  }

  try {
    if (type === "students") {
      await deleteStudentCascade(id);
    } else {
      await deleteDoc("exams", id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API DELETE]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 하위 호환: 옛 코드가 POST { type, data: [...] } 보내면 단건 PATCH로 전환
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body ?? {};
    if (
      !type ||
      !Array.isArray(data) ||
      (type !== "students" && type !== "exams")
    ) {
      return NextResponse.json({ error: "Invalid bulk payload" }, { status: 400 });
    }
    await Promise.all(
      data.map((item: any) => {
        if (!item?.id) throw new Error("Each item must have an id");
        return setDoc(type, item.id, item);
      }),
    );
    return NextResponse.json({ ok: true, count: data.length });
  } catch (e) {
    console.error("[API POST bulk]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
