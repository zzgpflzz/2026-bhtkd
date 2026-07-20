import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const revalidate = 60;

type VehicleCollection = "vehicleSchedules" | "studentVehicles";

// 서버 메모리 캐시
const serverCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 60초

// Firestore 헬퍼 함수
async function listCollection(name: VehicleCollection): Promise<unknown[]> {
  const cacheKey = `collection:${name}`;
  const cached = serverCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[vehicle cache HIT] ${cacheKey}`);
    return cached.data;
  }

  console.log(`[vehicle cache MISS] ${cacheKey} - fetching from Firestore...`);
  const db = getAdminDb();
  const snap = await db.collection(name).get();
  const data = snap.docs.map((d) => d.data());

  serverCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

async function getDoc(
  name: VehicleCollection,
  id: string,
): Promise<unknown | null> {
  const db = getAdminDb();
  const doc = await db.collection(name).doc(id).get();
  return doc.exists ? doc.data() : null;
}

async function setDoc(
  name: VehicleCollection,
  id: string,
  data: Record<string, unknown>,
) {
  const db = getAdminDb();
  await db.collection(name).doc(id).set(data, { merge: false });
}

async function deleteDoc(name: VehicleCollection, id: string) {
  const db = getAdminDb();
  await db.collection(name).doc(id).delete();
}

// 차량 게시물 삭제 시 해당 게시물의 모든 원생 차량 정보도 삭제
async function deleteScheduleCascade(scheduleId: string) {
  const db = getAdminDb();
  await db.collection("vehicleSchedules").doc(scheduleId).delete();

  const vehiclesSnap = await db
    .collection("studentVehicles")
    .where("scheduleId", "==", scheduleId)
    .get();
  if (vehiclesSnap.empty) return;

  const batch = db.batch();
  vehiclesSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// GET: 조회
export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  try {
    // type=schedules → vehicleSchedules
    // type=students → studentVehicles
    const collection =
      type === "schedules"
        ? "vehicleSchedules"
        : type === "students"
          ? "studentVehicles"
          : null;

    if (!collection) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // 단일 문서 조회
    if (id) {
      const doc = await getDoc(collection, id);
      console.log(
        `[API GET vehicle ${collection}/${id}] ${doc ? "found" : "not found"} · ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return NextResponse.json(doc);
    }

    // 전체 조회
    const list = await listCollection(collection);
    console.log(
      `[API GET vehicle ${collection}] ${list.length} docs · ${(performance.now() - t0).toFixed(0)}ms`,
    );
    return NextResponse.json(list);
  } catch (e) {
    console.error("[API GET vehicle]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT: 생성/수정
export async function PUT(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  console.log(`[API PUT vehicle] start type=${type} id=${id}`);

  const collection =
    type === "schedules"
      ? "vehicleSchedules"
      : type === "students"
        ? "studentVehicles"
        : null;

  if (!collection || !id) {
    console.warn(`[API PUT vehicle] 400 invalid params type=${type} id=${id}`);
    return NextResponse.json(
      { error: "type(schedules|students) and id are required" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || body.id !== id) {
      console.warn(
        `[API PUT vehicle] 400 body.id mismatch url=${id} body=${body?.id}`,
      );
      return NextResponse.json(
        { error: "Body must include matching id" },
        { status: 400 },
      );
    }
    await setDoc(collection, id, body);
    console.log(
      `[API PUT vehicle] OK type=${type} id=${id} ${(performance.now() - t0).toFixed(0)}ms`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[API PUT vehicle] FAILED type=${type} id=${id}`, e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE: 삭제
export async function DELETE(req: NextRequest) {
  const t0 = performance.now();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  console.log(`[API DELETE vehicle] start type=${type} id=${id}`);

  const collection =
    type === "schedules"
      ? "vehicleSchedules"
      : type === "students"
        ? "studentVehicles"
        : null;

  if (!collection || !id) {
    console.warn(
      `[API DELETE vehicle] 400 invalid params type=${type} id=${id}`,
    );
    return NextResponse.json(
      { error: "type(schedules|students) and id are required" },
      { status: 400 },
    );
  }

  try {
    if (type === "schedules") {
      await deleteScheduleCascade(id);
    } else {
      await deleteDoc(collection, id);
    }
    console.log(
      `[API DELETE vehicle] OK type=${type} id=${id} ${(performance.now() - t0).toFixed(0)}ms`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[API DELETE vehicle] FAILED type=${type} id=${id}`, e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
