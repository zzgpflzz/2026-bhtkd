import { Student, Exam, Grade } from "@/lib/types";

// 1. 데이터 불러오기
export async function loadStudents(): Promise<Student[]> {
  try {
    const res = await fetch("/api/storage?type=students", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to load students:", error);
    return [];
  }
}

export async function loadExams(): Promise<Exam[]> {
  try {
    const res = await fetch("/api/storage?type=exams", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to load exams:", error);
    return [];
  }
}

// 2. 학생 추가/수정 (반환값: Student[])
export async function upsertStudent(student: Student): Promise<Student[]> {
  try {
    const students = await loadStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) students[index] = student;
    else students.push(student);

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "students", data: students }),
    });

    if (!res.ok) {
      console.error("Failed to save student");
      return students;
    }

    return students;
  } catch (error) {
    console.error("Failed to upsert student:", error);
    return await loadStudents();
  }
}

// 3. 학생 삭제 (반환값: Student[])
export async function deleteStudent(id: string): Promise<Student[]> {
  try {
    const students = await loadStudents();
    const updated = students.filter((s) => s.id !== id);

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "students", data: updated }),
    });

    if (!res.ok) {
      console.error("Failed to delete student");
      return students;
    }

    return updated;
  } catch (error) {
    console.error("Failed to delete student:", error);
    return await loadStudents();
  }
}

// 4. 심사 추가/수정 (반환값: Exam[])
export async function upsertExam(exam: Exam): Promise<Exam[]> {
  try {
    const exams = await loadExams();
    const index = exams.findIndex((e) => e.id === exam.id);
    if (index >= 0) exams[index] = exam;
    else exams.push(exam);

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exams", data: exams }),
    });

    if (!res.ok) {
      console.error("Failed to save exam");
      return exams;
    }

    return exams;
  } catch (error) {
    console.error("Failed to upsert exam:", error);
    return await loadExams();
  }
}

// 5. 심사 삭제 (반환값: Exam[])
export async function deleteExam(id: string): Promise<Exam[]> {
  try {
    const exams = await loadExams();
    const updated = exams.filter((e) => e.id !== id);

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exams", data: updated }),
    });

    if (!res.ok) {
      console.error("Failed to delete exam");
      return exams;
    }

    return updated;
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return await loadExams();
  }
}

// 6. 유틸리티 함수
export async function findStudent(id: string): Promise<Student | null> {
  try {
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
    const exams = await loadExams();
    return exams.filter((e) => e.studentId === studentId);
  } catch (error) {
    console.error("Failed to get student exams:", error);
    return [];
  }
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
