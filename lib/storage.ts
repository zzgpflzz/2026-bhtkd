import { Student, Exam, Grade } from "@/lib/types";

// 1. 데이터 불러오기 (캐싱으로 속도 개선)
export async function loadStudents(): Promise<Student[]> {
  try {
    // 캐시가 유효하면 즉시 반환
    if (studentsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return studentsCache;
    }

    const res = await fetch("/api/storage?type=students", {
      cache: "no-store",
    });
    if (!res.ok) return studentsCache || [];
    const data = await res.json();
    const students = Array.isArray(data) ? data : [];

    // 캐시 업데이트
    studentsCache = students;
    cacheTimestamp = Date.now();

    return students;
  } catch (error) {
    console.error("Failed to load students:", error);
    return studentsCache || [];
  }
}

export async function loadExams(): Promise<Exam[]> {
  try {
    // 캐시가 유효하면 즉시 반환
    if (examsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return examsCache;
    }

    const res = await fetch("/api/storage?type=exams", { cache: "no-store" });
    if (!res.ok) return examsCache || [];
    const data = await res.json();
    const exams = Array.isArray(data) ? data : [];

    // 캐시 업데이트
    examsCache = exams;
    cacheTimestamp = Date.now();

    return exams;
  } catch (error) {
    console.error("Failed to load exams:", error);
    return examsCache || [];
  }
}

// 메모리 캐시 (빠른 접근용)
let studentsCache: Student[] | null = null;
let examsCache: Exam[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5초 캐시

// 2. 학생 추가/수정 (반환값: Student[]) - 진짜 낙관적 업데이트
export async function upsertStudent(student: Student): Promise<Student[]> {
  try {
    // 캐시에서 현재 학생 목록 가져오기 (API 호출 없이)
    const students = studentsCache ? [...studentsCache] : await loadStudents();

    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }

    // 캐시 즉시 업데이트
    studentsCache = students;
    cacheTimestamp = Date.now();

    // 백그라운드 저장 (완전히 비동기)
    fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "students", data: students }),
    }).catch((error) => console.error("❌ Save failed:", error));

    return students;
  } catch (error) {
    console.error("❌ upsertStudent error:", error);
    studentsCache = null;
    return await loadStudents();
  }
}

// 3. 학생 삭제 (반환값: Student[]) - 낙관적 업데이트
export async function deleteStudent(id: string): Promise<Student[]> {
  try {
    const students = studentsCache ? [...studentsCache] : await loadStudents();
    const updated = students.filter((s) => s.id !== id);

    // 캐시 즉시 업데이트
    studentsCache = updated;
    cacheTimestamp = Date.now();

    // 백그라운드 저장
    fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "students", data: updated }),
    }).catch((error) => console.error("❌ Delete failed:", error));

    return updated;
  } catch (error) {
    console.error("❌ deleteStudent error:", error);
    studentsCache = null;
    return await loadStudents();
  }
}

// 4. 심사 추가/수정 (반환값: Exam[]) - 낙관적 업데이트
export async function upsertExam(exam: Exam): Promise<Exam[]> {
  try {
    const exams = examsCache ? [...examsCache] : await loadExams();

    const index = exams.findIndex((e) => e.id === exam.id);
    if (index >= 0) {
      exams[index] = exam;
    } else {
      exams.push(exam);
    }

    // 캐시 즉시 업데이트
    examsCache = exams;
    cacheTimestamp = Date.now();

    // 백그라운드 저장
    fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exams", data: exams }),
    }).catch((error) => console.error("❌ Save failed:", error));

    return exams;
  } catch (error) {
    console.error("❌ upsertExam error:", error);
    examsCache = null;
    return await loadExams();
  }
}

// 5. 심사 삭제 (반환값: Exam[]) - 낙관적 업데이트
export async function deleteExam(id: string): Promise<Exam[]> {
  try {
    const exams = examsCache ? [...examsCache] : await loadExams();
    const updated = exams.filter((e) => e.id !== id);

    // 캐시 즉시 업데이트
    examsCache = updated;
    cacheTimestamp = Date.now();

    // 백그라운드 저장
    fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exams", data: updated }),
    }).catch((error) => console.error("❌ Delete failed:", error));

    return updated;
  } catch (error) {
    console.error("❌ deleteExam error:", error);
    examsCache = null;
    return await loadExams();
  }
}

// 6. 유틸리티 함수 (캐시 우선 활용)
export async function findStudent(id: string): Promise<Student | null> {
  try {
    // 캐시에서 먼저 찾기
    if (studentsCache) {
      const cached = studentsCache.find((s) => s.id === id);
      if (cached) return cached;
    }

    const students = await loadStudents();
    return students.find((s) => s.id === id) || null;
  } catch (error) {
    console.error("Failed to find student:", error);
    return null;
  }
}

export async function findStudentByNameAndBirthDate(
  name: string,
  birthDate: string
): Promise<Student | null> {
  try {
    const students = await loadStudents();
    return (
      students.find(
        (s) =>
          s.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          s.birthDate === birthDate
      ) || null
    );
  } catch (error) {
    console.error("Failed to find student by name and birthdate:", error);
    return null;
  }
}

export async function getStudentExams(studentId: string): Promise<Exam[]> {
  try {
    // 캐시에서 먼저 찾기
    if (examsCache) {
      return examsCache.filter((e) => e.studentId === studentId);
    }

    const exams = await loadExams();
    return exams.filter((e) => e.studentId === studentId);
  } catch (error) {
    console.error("Failed to get student exams:", error);
    return [];
  }
}

// 캐시 무효화 (필요 시 사용)
export function clearCache() {
  studentsCache = null;
  examsCache = null;
  cacheTimestamp = 0;
}

export const newStudentTemplate = (id?: string): Student => ({
  id: id || `student-${Date.now()}`,
  name: "",
  birthDate: "",
  photoUrl: "",
  googleLink: "",
  isEnglishName: false,
});

export const newExamTemplate = (studentId: string): Exam => ({
  id: `exam-${Date.now()}`,
  studentId,
  examDate: new Date().toISOString().split("T")[0],
  currentGrade: "10급" as Grade,
  targetGrade: "9급" as Grade,
  basicSkills: {
    basics: 3,
    poomsae: 3,
    sparring: 3,
    breaking: 3,
  },
  attitude: {
    concentration: 3,
    challenge: 3,
    greeting: 3,
    confidence: 3,
  },
  lifeHabits: {
    uniform: 3,
    language: 3,
    organization: 3,
    rules: 3,
  },
  comment: "",
  passed: false,
});
