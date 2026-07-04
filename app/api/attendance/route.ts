import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type {
  AttendanceStudent,
  AttendanceRecord,
} from "@/lib/types";

const db = getAdminDb();

// GET: 원생 목록 또는 출석 기록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'students' | 'records'
    const id = searchParams.get("id");

    if (type === "students") {
      if (id) {
        // 단일 원생 조회
        const doc = await db.collection("attendanceStudents").doc(id).get();
        if (!doc.exists) {
          return NextResponse.json(
            { error: "원생을 찾을 수 없습니다" },
            { status: 404 },
          );
        }
        return NextResponse.json(doc.data());
      } else {
        // 전체 원생 목록
        const snapshot = await db.collection("attendanceStudents").get();
        const students: AttendanceStudent[] = snapshot.docs.map(
          (doc) => doc.data() as AttendanceStudent,
        );
        return NextResponse.json(students);
      }
    } else if (type === "records") {
      if (id) {
        // 단일 기록 조회
        const doc = await db.collection("attendanceRecords").doc(id).get();
        if (!doc.exists) {
          return NextResponse.json(
            { error: "기록을 찾을 수 없습니다" },
            { status: 404 },
          );
        }
        return NextResponse.json(doc.data());
      } else {
        // 전체 출석 기록
        const snapshot = await db.collection("attendanceRecords").get();
        const records: AttendanceRecord[] = snapshot.docs.map(
          (doc) => doc.data() as AttendanceRecord,
        );
        return NextResponse.json(records);
      }
    }

    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/attendance]", error);
    return NextResponse.json(
      { error: "데이터 조회 실패" },
      { status: 500 },
    );
  }
}

// PUT: 원생 또는 출석 기록 생성/수정
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const bulk = searchParams.get("bulk") === "true";

    if (type === "students" && id) {
      const student: AttendanceStudent = await req.json();
      await db.collection("attendanceStudents").doc(id).set(student);
      return NextResponse.json({ success: true });
    } else if (type === "records") {
      if (bulk) {
        // 일괄 저장
        const records: AttendanceRecord[] = await req.json();
        const batch = db.batch();
        records.forEach((record) => {
          const ref = db.collection("attendanceRecords").doc(record.id);
          batch.set(ref, record);
        });
        await batch.commit();
        return NextResponse.json({ success: true });
      } else if (id) {
        // 단일 저장
        const record: AttendanceRecord = await req.json();
        await db.collection("attendanceRecords").doc(id).set(record);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  } catch (error) {
    console.error("[PUT /api/attendance]", error);
    return NextResponse.json(
      { error: "데이터 저장 실패" },
      { status: 500 },
    );
  }
}

// DELETE: 원생 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    if (type === "students") {
      await db.collection("attendanceStudents").doc(id).delete();
      // 해당 원생의 출석 기록도 삭제
      const recordsSnapshot = await db
        .collection("attendanceRecords")
        .where("studentId", "==", id)
        .get();
      const batch = db.batch();
      recordsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  } catch (error) {
    console.error("[DELETE /api/attendance]", error);
    return NextResponse.json(
      { error: "데이터 삭제 실패" },
      { status: 500 },
    );
  }
}
