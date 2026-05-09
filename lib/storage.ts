"use client";

import type { Student, Exam } from "./types";

const STUDENTS_KEY = "baekho-students-v2";
const EXAMS_KEY = "baekho-exams-v2";

// 초기 시드 데이터
const seedStudents: Student[] = [
  {
    id: "stu_001",
    name: "김도현",
    birthDate: "2015-04-12",
    photoUrl: "",
    googleLink: "",
  },
  {
    id: "stu_002",
    name: "박서연",
    birthDate: "2016-09-23",
    photoUrl: "",
    googleLink: "",
  },
];

const seedExams: Exam[] = [
  {
    id: "exam_001",
    studentId: "stu_001",
    examDate: "2026-05-09",
    currentGrade: "8급",
    targetGrade: "7급",
    basicSkills: { basics: 5, poomsae: 4, sparring: 5, breaking: 4 },
    attitude: { concentration: 5, challenge: 5, greeting: 5, confidence: 4 },
    lifeHabits: { uniform: 5, language: 5, organization: 4, rules: 5 },
    comment: "기본동작이 매우 정확하고 자세가 안정적입니다. 발차기에 힘이 실려 있어 또래보다 한 걸음 앞선 모습이에요.",
    passed: true,
  },
  {
    id: "exam_002",
    studentId: "stu_002",
    examDate: "2026-05-09",
    currentGrade: "9급",
    targetGrade: "8급",
    basicSkills: { basics: 4, poomsae: 5, sparring: 4, breaking: 4 },
    attitude: { concentration: 5, challenge: 4, greeting: 5, confidence: 5 },
    lifeHabits: { uniform: 5, language: 5, organization: 5, rules: 5 },
    comment: "품새 동작의 흐름이 매끄럽고 박자 감각이 뛰어납니다. 친구들에게 양보하고 도와주는 모습이 인상 깊었어요.",
    passed: true,
  },
];

export function loadStudents(): Student[] {
  if (typeof window === "undefined") return seedStudents;
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(seedStudents));
      return seedStudents;
    }
    const parsed = JSON.parse(raw) as Student[];
    return Array.isArray(parsed) ? parsed : seedStudents;
  } catch {
    return seedStudents;
  }
}

export function saveStudents(students: Student[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function loadExams(): Exam[] {
  if (typeof window === "undefined") return seedExams;
  try {
    const raw = localStorage.getItem(EXAMS_KEY);
    if (!raw) {
      localStorage.setItem(EXAMS_KEY, JSON.stringify(seedExams));
      return seedExams;
    }
    const parsed = JSON.parse(raw) as Exam[];
    return Array.isArray(parsed) ? parsed : seedExams;
  } catch {
    return seedExams;
  }
}

export function saveExams(exams: Exam[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

export function findStudent(name: string, birthDate: string): Student | null {
  const students = loadStudents();
  const trimmed = name.trim();
  return (
    students.find(
      (s) => s.name.trim() === trimmed && s.birthDate === birthDate,
    ) ?? null
  );
}

export function getStudentExams(studentId: string): Exam[] {
  return loadExams()
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
}

export function upsertStudent(student: Student): Student[] {
  const list = loadStudents();
  const idx = list.findIndex((s) => s.id === student.id);
  if (idx >= 0) list[idx] = student;
  else list.push(student);
  saveStudents(list);
  return list;
}

export function deleteStudent(id: string): Student[] {
  const list = loadStudents().filter((s) => s.id !== id);
  saveStudents(list);
  // 해당 학생의 심사 기록도 삭제
  const exams = loadExams().filter((e) => e.studentId !== id);
  saveExams(exams);
  return list;
}

export function upsertExam(exam: Exam): Exam[] {
  const list = loadExams();
  const idx = list.findIndex((e) => e.id === exam.id);
  if (idx >= 0) list[idx] = exam;
  else list.push(exam);
  saveExams(list);
  return list;
}

export function deleteExam(id: string): Exam[] {
  const list = loadExams().filter((e) => e.id !== id);
  saveExams(list);
  return list;
}

export function newStudentTemplate(): Student {
  return {
    id: `stu_${Date.now()}`,
    name: "",
    birthDate: "",
    photoUrl: "",
    googleLink: "",
  };
}

export function newExamTemplate(studentId: string): Exam {
  return {
    id: `exam_${Date.now()}`,
    studentId,
    examDate: new Date().toISOString().slice(0, 10),
    currentGrade: "10급",
    targetGrade: "9급",
    basicSkills: { basics: 3, poomsae: 3, sparring: 3, breaking: 3 },
    attitude: { concentration: 3, challenge: 3, greeting: 3, confidence: 3 },
    lifeHabits: { uniform: 3, language: 3, organization: 3, rules: 3 },
    comment: "",
    passed: true,
  };
}
