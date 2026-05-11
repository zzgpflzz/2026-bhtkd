import { NextRequest, NextResponse } from "next/server";

import { initializeApp, getApps } from "firebase/app";

import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";



// const firebaseConfig = {

  apiKey: "AIzaSyCM9Ph-47dtlMjLSordkd8ptz8mQsN6b7s",

  authDomain: "bhtkd-37f39.firebaseapp.com",

  projectId: "bhtkd-37f39",

  storageBucket: "bhtkd-37f39.firebasestorage.app",

  messagingSenderId: "958986396749",

  appId: "1:958986396749:web:a5973bf06304a3842a6804"

};



// 초기화

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);



export const dynamic = 'force-dynamic';



export async function GET(req: NextRequest) {

  try {

    const type = new URL(req.url).searchParams.get("type");

    const docRef = doc(db, "data", "taekwondo"); // 'data' 상자의 'taekwondo' 문서

    const docSnap = await getDoc(docRef);



    let allData = { students: [], exams: [] };

    if (docSnap.exists()) {

      allData = docSnap.data() as any;

    }



    if (type === "students") return NextResponse.json(allData.students || []);

    if (type === "exams") return NextResponse.json(allData.exams || []);

    return NextResponse.json(allData);

  } catch (error) {

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



    await setDoc(docRef, currentData); // Firebase에 영구 저장

    return NextResponse.json({ success: true });

  } catch (error) {

    return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  }

}