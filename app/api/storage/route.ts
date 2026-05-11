import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// 작업자님의 실제 Firebase 키 값을 적용했습니다.
const firebaseConfig = {
  apiKey: "AIzaSyCM9Ph-47dtlMjLSordkd8ptz8mQsN6b7s",
  authDomain: "bhtkd-37f39.firebaseapp.com",
  projectId: "bhtkd-37f39",
  storageBucket: "bhtkd-37f39.appspot.com",
  messagingSenderId: "367355152865",
  appId: "1:367355152865:web:562b53b050b16d1f951e70",
};

// Firebase 초기화 (중복 실행 방지)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get("type");
    console.log("🔍 [API GET] Request type:", type);

    const docRef = doc(db, "data", "taekwondo");
    const docSnap = await getDoc(docRef);

    let allData = { students: [], exams: [] };
    if (docSnap.exists()) {
      allData = docSnap.data() as any;
      console.log("✅ [API GET] Document exists, data loaded:", {
        studentsCount: allData.students?.length || 0,
        examsCount: allData.exams?.length || 0,
      });
    } else {
      console.log("⚠️ [API GET] Document does not exist, returning empty data");
    }

    if (type === "students") {
      console.log("📤 [API GET] Returning students:", allData.students?.length || 0);
      return NextResponse.json(allData.students || []);
    }
    if (type === "exams") {
      console.log("📤 [API GET] Returning exams:", allData.exams?.length || 0);
      return NextResponse.json(allData.exams || []);
    }
    console.log("📤 [API GET] Returning all data");
    return NextResponse.json(allData);
  } catch (error) {
    console.error("❌ [API GET] Firebase GET Error:", error);
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

    const docRef = doc(db, "data", "taekwondo");
    console.log("🔍 [API POST] Fetching current document...");
    const docSnap = await getDoc(docRef);

    let currentData: { students: any[]; exams: any[] } = {
      students: [],
      exams: [],
    };

    if (docSnap.exists()) {
      const existingData = docSnap.data();
      console.log("✅ [API POST] Document exists, current data:", {
        studentsCount: existingData.students?.length || 0,
        examsCount: existingData.exams?.length || 0,
      });
      currentData = {
        students: existingData.students || [],
        exams: existingData.exams || [],
      };
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

    // setDoc으로 전체 문서 덮어쓰기 (merge 없이, 명시적으로 전체 구조 유지)
    await setDoc(docRef, currentData);

    console.log("✅ [API POST] Successfully saved to Firestore");

    // 저장 후 검증
    const verifySnap = await getDoc(docRef);
    if (verifySnap.exists()) {
      const verifyData = verifySnap.data();
      console.log("✅ [API POST] Verification - Data confirmed in Firestore:", {
        studentsCount: verifyData.students?.length || 0,
        examsCount: verifyData.exams?.length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      count: payload.length,
    });
  } catch (error) {
    console.error("❌ [API POST] Firebase POST Error:", error);
    return NextResponse.json(
      { error: "저장 실패", details: String(error) },
      { status: 500 }
    );
  }
}
