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
    const docRef = doc(db, "data", "taekwondo");
    const docSnap = await getDoc(docRef);

    let allData = { students: [], exams: [] };
    if (docSnap.exists()) {
      allData = docSnap.data() as any;
    }

    if (type === "students") return NextResponse.json(allData.students || []);
    if (type === "exams") return NextResponse.json(allData.exams || []);
    return NextResponse.json(allData);
  } catch (error) {
    console.error("Firebase GET Error:", error);
    return NextResponse.json({ students: [], exams: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, data: payload } = await req.json();
    const docRef = doc(db, "data", "taekwondo");
    const docSnap = await getDoc(docRef);

    let currentData = { students: [], exams: [] };
    if (docSnap.exists()) {
      currentData = docSnap.data() as any;
    }

    if (type === "students") currentData.students = payload;
    else if (type === "exams") currentData.exams = payload;

    await setDoc(docRef, currentData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Firebase POST Error:", error);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
