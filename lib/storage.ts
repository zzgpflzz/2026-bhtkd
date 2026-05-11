import { Student, Exam } from "@/lib/types";

// 1. 데이터 불러오기
export async function loadStudents(): Promise<Student[]> {
  try {
    const res = await fetch("/api/storage?type=students", {
      cache: "no-store",
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

export async function loadExams(): Promise<Exam[]> {
  try {
    const res = await fetch("/api/storage?type=exams", { cache: "no-store" });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

// 2. 학생 추가/수정 (반환값: Student[])
export async function upsertStudent(student: Student): Promise<Student[]> {
  const students = await loadStudents();
  const index = students.findIndex((s) => s.id === student.id);
  if (index >= 0) students[index] = student;
  else students.push(student);

  await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "students", data: students }),
  });
  return students;
}

// 3. 학생 삭제 (반환값: Student[])
export async function deleteStudent(id: string): Promise<Student[]> {
  const students = await loadStudents();
  const updated = students.filter((s) => s.id !== id);
  await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "students", data: updated }),
  });
  return updated;
}

// 4. 심사 추가/수정 (반환값: Exam[])
export async function upsertExam(exam: Exam): Promise<Exam[]> {
  const exams = await loadExams();
  const index = exams.findIndex((e) => e.id === exam.id);
  if (index >= 0) exams[index] = exam;
  else exams.push(exam);

  await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "exams", data: exams }),
  });
  return exams;
}

// 5. 심사 삭제 (반환값: Exam[])
export async function deleteExam(id: string): Promise<Exam[]> {
  const exams = await loadExams();
  const updated = exams.filter((e) => e.id !== id);
  await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "exams", data: updated }),
  });
  return updated;
}

// 6. 유틸리티 함수
export async function findStudent(id: string) {
  const students = await loadStudents();
  return students.find((s) => s.id === id) || null;
}

export async function getStudentExams(studentId: string) {
  const exams = await loadExams();
  return exams.filter((e) => e.studentId === studentId);
}

export const newStudentTemplate = (id: string): Student => ({
  id,
  name: "",
  birthDate: "",
  phone: "",
  belt: "흰띠",
  startDate: new Date().toISOString().split("T")[0],
  status: "수련중",
});

export const newExamTemplate = (studentId: string): Exam => ({
  id: `exam-${Date.now()}`,
  studentId,
  date: new Date().toISOString().split("T")[0],
  type: "정기승급심사",
  belt: "흰띠",
  score: { basic: 0, poomsae: 0, sparring: 0, attitude: 0, breaking: 0 },
  isPassed: false,
});
