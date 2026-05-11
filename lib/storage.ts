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
    console.log("🔍 [upsertStudent] Starting upsert for student:", {
      id: student.id,
      name: student.name,
    });

    const students = await loadStudents();
    console.log("📋 [upsertStudent] Current students count:", students.length);

    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      console.log("✏️ [upsertStudent] Updating existing student at index:", index);
      students[index] = student;
    } else {
      console.log("➕ [upsertStudent] Adding new student");
      students.push(student);
    }

    console.log("📤 [upsertStudent] Sending to API, total students:", students.length);

    const payload = { type: "students", data: students };
    console.log("📦 [upsertStudent] Payload structure:", {
      type: payload.type,
      dataIsArray: Array.isArray(payload.data),
      dataLength: payload.data.length,
    });

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 [upsertStudent] API response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ [upsertStudent] API returned error:", errorText);
      return students;
    }

    const responseData = await res.json();
    console.log("✅ [upsertStudent] API response:", responseData);
    console.log("✅ [upsertStudent] Successfully saved, returning updated array");

    return students;
  } catch (error) {
    console.error("❌ [upsertStudent] Exception caught:", error);
    return await loadStudents();
  }
}

// 3. 학생 삭제 (반환값: Student[])
export async function deleteStudent(id: string): Promise<Student[]> {
  try {
    console.log("🔍 [deleteStudent] Starting delete for student ID:", id);

    const students = await loadStudents();
    console.log("📋 [deleteStudent] Current students count:", students.length);

    const updated = students.filter((s) => s.id !== id);
    console.log("🗑️ [deleteStudent] After filter, remaining students:", updated.length);

    const payload = { type: "students", data: updated };
    console.log("📤 [deleteStudent] Sending to API");

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 [deleteStudent] API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ [deleteStudent] API returned error:", errorText);
      return students;
    }

    console.log("✅ [deleteStudent] Successfully deleted");
    return updated;
  } catch (error) {
    console.error("❌ [deleteStudent] Exception caught:", error);
    return await loadStudents();
  }
}

// 4. 심사 추가/수정 (반환값: Exam[])
export async function upsertExam(exam: Exam): Promise<Exam[]> {
  try {
    console.log("🔍 [upsertExam] Starting upsert for exam:", {
      id: exam.id,
      studentId: exam.studentId,
      examDate: exam.examDate,
    });

    const exams = await loadExams();
    console.log("📋 [upsertExam] Current exams count:", exams.length);

    const index = exams.findIndex((e) => e.id === exam.id);
    if (index >= 0) {
      console.log("✏️ [upsertExam] Updating existing exam at index:", index);
      exams[index] = exam;
    } else {
      console.log("➕ [upsertExam] Adding new exam");
      exams.push(exam);
    }

    console.log("📤 [upsertExam] Sending to API, total exams:", exams.length);

    const payload = { type: "exams", data: exams };

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 [upsertExam] API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ [upsertExam] API returned error:", errorText);
      return exams;
    }

    const responseData = await res.json();
    console.log("✅ [upsertExam] API response:", responseData);

    return exams;
  } catch (error) {
    console.error("❌ [upsertExam] Exception caught:", error);
    return await loadExams();
  }
}

// 5. 심사 삭제 (반환값: Exam[])
export async function deleteExam(id: string): Promise<Exam[]> {
  try {
    console.log("🔍 [deleteExam] Starting delete for exam ID:", id);

    const exams = await loadExams();
    console.log("📋 [deleteExam] Current exams count:", exams.length);

    const updated = exams.filter((e) => e.id !== id);
    console.log("🗑️ [deleteExam] After filter, remaining exams:", updated.length);

    const payload = { type: "exams", data: updated };

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 [deleteExam] API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ [deleteExam] API returned error:", errorText);
      return exams;
    }

    console.log("✅ [deleteExam] Successfully deleted");
    return updated;
  } catch (error) {
    console.error("❌ [deleteExam] Exception caught:", error);
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
