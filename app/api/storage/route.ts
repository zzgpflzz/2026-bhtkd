import { NextRequest, NextResponse } from "next/server";

// Firebase Firestore REST API 사용
// Admin SDK보다 간단하고 API Key만으로 작동
const FIREBASE_CONFIG = {
  projectId: "bhtkd-37f39",
  apiKey: "AIzaSyCM9Ph-47dtlMjLSordkd8ptz8mQsN6b7s",
};

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Firestore 문서 가져오기
async function getFirestoreDocument(path: string) {
  const url = `${FIRESTORE_BASE_URL}/${path}?key=${FIREBASE_CONFIG.apiKey}`;
  const response = await fetch(url);

  if (response.status === 404) {
    return null; // 문서가 존재하지 않음
  }

  if (!response.ok) {
    throw new Error(`Firestore GET failed: ${response.statusText}`);
  }

  return await response.json();
}

// Firestore 문서 생성/업데이트
async function setFirestoreDocument(path: string, data: any) {
  const url = `${FIRESTORE_BASE_URL}/${path}?key=${FIREBASE_CONFIG.apiKey}`;

  // Firestore REST API 형식으로 변환
  const firestoreData = {
    fields: {
      students: {
        arrayValue: {
          values: (data.students || []).map((student: any) => ({
            mapValue: { fields: convertToFirestoreFields(student) },
          })),
        },
      },
      exams: {
        arrayValue: {
          values: (data.exams || []).map((exam: any) => ({
            mapValue: { fields: convertToFirestoreFields(exam) },
          })),
        },
      },
    },
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(firestoreData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore SET failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

// JavaScript 객체를 Firestore 필드 형식으로 변환
function convertToFirestoreFields(obj: any): any {
  const fields: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "object" && !Array.isArray(value)) {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((item) => {
            if (typeof item === "object") {
              return { mapValue: { fields: convertToFirestoreFields(item) } };
            }
            return convertToFirestoreFields({ value: item }).value;
          }),
        },
      };
    }
  }

  return fields;
}

// Firestore 형식에서 JavaScript 객체로 변환
function convertFromFirestoreFields(fields: any): any {
  const obj: any = {};

  for (const [key, value] of Object.entries(fields as any)) {
    const val = value as any;

    if (val.stringValue !== undefined) {
      obj[key] = val.stringValue;
    } else if (val.integerValue !== undefined) {
      obj[key] = parseInt(val.integerValue);
    } else if (val.doubleValue !== undefined) {
      obj[key] = val.doubleValue;
    } else if (val.booleanValue !== undefined) {
      obj[key] = val.booleanValue;
    } else if (val.nullValue !== undefined) {
      obj[key] = null;
    } else if (val.mapValue) {
      obj[key] = convertFromFirestoreFields(val.mapValue.fields);
    } else if (val.arrayValue) {
      obj[key] = val.arrayValue.values?.map((item: any) => {
        if (item.mapValue) {
          return convertFromFirestoreFields(item.mapValue.fields);
        }
        return convertFromFirestoreFields({ value: item }).value;
      }) || [];
    }
  }

  return obj;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get("type");
    console.log("🔍 [API GET] Request type:", type);

    const doc = await getFirestoreDocument("data/taekwondo");

    let allData = { students: [], exams: [] };

    if (doc && doc.fields) {
      // Firestore REST API 형식에서 변환
      const students = doc.fields.students?.arrayValue?.values || [];
      const exams = doc.fields.exams?.arrayValue?.values || [];

      allData = {
        students: students.map((item: any) =>
          convertFromFirestoreFields(item.mapValue?.fields || {})
        ),
        exams: exams.map((item: any) =>
          convertFromFirestoreFields(item.mapValue?.fields || {})
        ),
      };

      console.log("✅ [API GET] Document exists, data loaded:", {
        studentsCount: allData.students.length,
        examsCount: allData.exams.length,
      });
    } else {
      console.log("⚠️ [API GET] Document does not exist, returning empty data");
    }

    if (type === "students") {
      console.log("📤 [API GET] Returning students:", allData.students.length);
      return NextResponse.json(allData.students);
    }
    if (type === "exams") {
      console.log("📤 [API GET] Returning exams:", allData.exams.length);
      return NextResponse.json(allData.exams);
    }
    console.log("📤 [API GET] Returning all data");
    return NextResponse.json(allData);
  } catch (error) {
    console.error("❌ [API GET] Firestore GET Error:", error);
    return NextResponse.json({ students: [], exams: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data: payload } = body;

    console.log("🔍 [API POST] Request received:", {
      type,
      payloadType: Array.isArray(payload) ? "array" : typeof payload,
      payloadLength: Array.isArray(payload) ? payload.length : "N/A",
      firstItem: Array.isArray(payload) && payload.length > 0 ? payload[0] : null,
    });

    if (!type || !payload) {
      console.error("❌ [API POST] Missing type or payload");
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    if (type !== "students" && type !== "exams") {
      console.error("❌ [API POST] Invalid type:", type);
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!Array.isArray(payload)) {
      console.error("❌ [API POST] Payload is not an array:", typeof payload);
      return NextResponse.json(
        { error: "Data must be an array" },
        { status: 400 }
      );
    }

    console.log("🔍 [API POST] Fetching current document...");
    const doc = await getFirestoreDocument("data/taekwondo");

    let currentData: { students: any[]; exams: any[] } = {
      students: [],
      exams: [],
    };

    if (doc && doc.fields) {
      // 기존 데이터 변환
      const students = doc.fields.students?.arrayValue?.values || [];
      const exams = doc.fields.exams?.arrayValue?.values || [];

      currentData = {
        students: students.map((item: any) =>
          convertFromFirestoreFields(item.mapValue?.fields || {})
        ),
        exams: exams.map((item: any) =>
          convertFromFirestoreFields(item.mapValue?.fields || {})
        ),
      };

      console.log("✅ [API POST] Document exists, current data:", {
        studentsCount: currentData.students.length,
        examsCount: currentData.exams.length,
      });
    } else {
      console.log("⚠️ [API POST] Document does not exist, will create new");
    }

    // 데이터 업데이트
    if (type === "students") {
      currentData.students = payload;
      console.log("📝 [API POST] Updated students array, new count:", payload.length);
    } else if (type === "exams") {
      currentData.exams = payload;
      console.log("📝 [API POST] Updated exams array, new count:", payload.length);
    }

    console.log("💾 [API POST] Saving to Firestore...", {
      studentsCount: currentData.students.length,
      examsCount: currentData.exams.length,
    });

    // Firestore REST API로 저장
    await setFirestoreDocument("data/taekwondo", currentData);

    console.log("✅ [API POST] Successfully saved to Firestore");

    // 저장 후 검증
    const verifyDoc = await getFirestoreDocument("data/taekwondo");
    if (verifyDoc && verifyDoc.fields) {
      const verifyStudents = verifyDoc.fields.students?.arrayValue?.values || [];
      const verifyExams = verifyDoc.fields.exams?.arrayValue?.values || [];

      console.log("✅ [API POST] Verification - Data confirmed in Firestore:", {
        studentsCount: verifyStudents.length,
        examsCount: verifyExams.length,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      count: payload.length,
    });
  } catch (error) {
    console.error("❌ [API POST] Firestore POST Error:", error);
    return NextResponse.json(
      { error: "저장 실패", details: String(error) },
      { status: 500 }
    );
  }
}
