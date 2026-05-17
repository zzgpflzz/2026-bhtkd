import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs"; // firebase-admin은 Node.js 런타임 필요
export const revalidate = 60; // 60초 캐싱 (어드민 전용이므로 길게 설정)

type Collection = "students" | "exams";

// ─────────────────────────────────────────────
// 서버 메모리 캐시 (Vercel 서버리스 인스턴스 간 공유되지 않음)
// ─────────────────────────────────────────────
const serverCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 60초

// ─────────────────────────────────────────────
// Firestore Admin SDK 헬퍼 (메모리 캐시 포함)
// ─────────────────────────────────────────────
async function listCollection(name: Collection): Promise<unknown[]> {
  const cacheKey = `collection:${name}`;
  const cached = serverCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[cache HIT] ${cacheKey}`);
    return cached.data;
  }

  console.log(`[cache MISS] ${cacheKey} - fetching from Firestore...`);
  const db = getAdminDb();
  const snap = await db.collection(name).get();
  const data = snap.docs.map((d) => d.data());

  serverCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

async function getDoc(name: Collection, id: string): Promise<unknown | null> {
  const db = getAdminDb();
  const doc = await db.collection(name).doc(id).get();
  return doc.exists ? doc.data() : null;
}

async function setDoc(name: Collection, id: string, data: Record<string, unknown>) {
  const db = getAdminDb();
  await db.collection(name).doc(id).set(data, { merge: false });
}

async function deleteDoc(name: Collection, id: string) {
  const db = getAdminDb();
  await db.collection(name).doc(id).delete();
}

// 학생 삭제 시 해당 학생의 모든 exam도 같이 삭제
async function deleteStudentCascade(studentId: string) {
  const db = getAdminDb();
  await db.collection("students").doc(studentId).delete();

  const examsSnap = await db
    .collection("exams")
    .where("studentId", "==", studentId)
    .get();
  if (examsSnap.empty) return;

  const batch = db.batch();
  examsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// ─────────────────────────────────────────────
// 1회 자동 마이그레이션
// 옛 단일 문서 data/taekwondo → students/{id}, exams/{id} 컬렉션
// ─────────────────────────────────────────────
let migrationAttempted = false;

async function ensureMigrated() {
  if (migrationAttempted) return;
  migrationAttempted = true;

  try {
    const db = getAdminDb();
    const studentsSnap = await db.collection("students").limit(1).get();
    if (!studentsSnap.empty) return; // 이미 컬렉션에 데이터 있음

    const legacyDoc = await db.collection("data").doc("taekwondo").get();
    if (!legacyDoc.exists) return; // 옛 문서도 없음 — 신규 설치
    const data = legacyDoc.data() ?? {};
    const students = Array.isArray(data.students) ? data.students : [];
    const exams = Array.isArray(data.exams) ? data.exams : [];
    if (students.length === 0 && exams.length === 0) return;

    console.log(
      `[migration] copying ${students.length} students, ${exams.length} exams`,
    );

    // Firestore batch는 500 작업 제한이 있어서 분할
    const all = [
      ...students
        .filter((s: any) => s?.id)
        .map((s: any) => ({ col: "students" as const, id: s.id as string, data: s })),
      ...exams
        .filter((e: any) => e?.id)
        .map((e: any) => ({ col: "exams" as const, id: e.id as string, data: e })),
    ];
    for (let i = 0; i < all.length; i += 400) {
      const batch = db.batch();
      for (const op of all.slice(i, i + 400)) {
        batch.set(db.collection(op.col).doc(op.id), op.data);
      }
      await batch.commit();
    }
    console.log("[migration] complete");
  } catch (e) {
    console.error("[migration] failed:", e);
    migrationAttempted = false; // 다음 요청에서 재시도
  }
}

// ─────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  try {
    await ensureMigrated();

    // 단일 문서 조회: GET /api/storage?type=students&id=xxx
    if (id && (type === "students" || type === "exams")) {
      const doc = await getDoc(type as Collection, id);
      console.log(
        `[API GET ${type}/${id}] ${doc ? "found" : "not found"} · ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return NextResponse.json(doc);
    }

    // 컬렉션 전체 조회
    if (type === "students" || type === "exams") {
      const list = await listCollection(type as Collection);
      console.log(
        `[API GET ${type}] ${list.length} docs · ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return NextResponse.json(list);
    }

    // 둘 다 조회
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
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  console.log(`[API PUT] start type=${type} id=${id}`);

  if (!type || !id || (type !== "students" && type !== "exams")) {
    console.warn(`[API PUT] 400 invalid params type=${type} id=${id}`);
    return NextResponse.json(
      { error: "type(students|exams) and id are required" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || body.id !== id) {
      console.warn(`[API PUT] 400 body.id mismatch url=${id} body=${body?.id}`);
      return NextResponse.json(
        { error: "Body must include matching id" },
        { status: 400 },
      );
    }
    await setDoc(type as Collection, id, body);
    console.log(
      `[API PUT] OK type=${type} id=${id} ${(performance.now() - t0).toFixed(0)}ms`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[API PUT] FAILED type=${type} id=${id}`, e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 단건 삭제: DELETE /api/storage?type=students&id=xxx
export async function DELETE(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  console.log(`[API DELETE] start type=${type} id=${id}`);

  if (!type || !id || (type !== "students" && type !== "exams")) {
    console.warn(`[API DELETE] 400 invalid params type=${type} id=${id}`);
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
    console.log(
      `[API DELETE] OK type=${type} id=${id} ${(performance.now() - t0).toFixed(0)}ms`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[API DELETE] FAILED type=${type} id=${id}`, e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 하위 호환: 옛 코드가 POST { type, data: [...] } 보내면 batch로 일괄 set
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
    const db = getAdminDb();
    for (let i = 0; i < data.length; i += 400) {
      const batch = db.batch();
      for (const item of data.slice(i, i + 400)) {
        if (!item?.id) throw new Error("Each item must have an id");
        batch.set(db.collection(type as Collection).doc(item.id), item);
      }
      await batch.commit();
    }
    return NextResponse.json({ ok: true, count: data.length });
  } catch (e) {
    console.error("[API POST bulk]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
