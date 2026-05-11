import { Student, Exam } from "@/lib/types";

// 데이터를 불러오는 함수
export async function getStudents(): Promise<Student[]> {
  try {
    const res = await fetch("/api/storage?type=students", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : []; // 무조건 배열로 반환
  } catch (error) {
    console.error("getStudents Error:", error);
    return [];
  }
}

export async function getExams(): Promise<Exam[]> {
  try {
    const res = await fetch("/api/storage?type=exams", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("getExams Error:", error);
    return [];
  }
}

// 데이터를 저장하는 함수
export async function saveStudents(students: Student[]) {
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "students", data: students }),
  });
  return res.ok;
}

export async function saveExams(exams: Exam[]) {
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "exams", data: exams }),
  });
  return res.ok;
}
