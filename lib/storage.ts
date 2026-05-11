"use client";

import type { Student, Exam } from "./types";

let studentsCache: Student[] = [];
let examsCache: Exam[] = [];

export async function loadStudents(): Promise<Student[]> {
  try {
    const res = await fetch("/api/storage?type=students");
    if (!res.ok) throw new Error("Failed to load students");
    const data = await res.json();
    studentsCache = Array.isArray(data) ? data : (data || []);
    return studentsCache;
  } catch (error) {
    console.error("loadStudents error:", error);
    return studentsCache.length > 0 ? studentsCache : [];
  }
}

export async function saveStudents(students: Student[]): Promise<void> {
  studentsCache = students;
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "students", data: students }),
    });
    if (!res.ok) throw new Error("Failed to save students");
  } catch (error) {
    console.error("saveStudents error:", error);
    throw error;
  }
}

export async function loadExams(): Promise<Exam[]> {
  try {
    const res = await fetch("/api/storage?type=exams");
    if (!res.ok) throw new Error("Failed to load exams");
    const data = await res.json();
    examsCache = Array.isArray(data) ? data : (data || []);
    return examsCache;
  } catch (error) {
    console.error("loadExams error:", error);
    return examsCache.length > 0 ? examsCache : [];
  }
}

export async function saveExams(exams: Exam[]): Promise<void> {
  examsCache = exams;
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exams", data: exams }),
    });
    if (!res.ok) throw new Error("Failed to save exams");
  } catch (error) {
    console.error("saveExams error:", error);
    throw error;
  }
}

export async function findStudent(name: string, birthDate: string): Promise<Student | null> {
  const students = await loadStudents();
  const trimmed = name.trim();
  return (
    students.find(
      (s) => s.name.trim() === trimmed && s.birthDate === birthDate,
    ) ?? null
  );
}

export async function getStudentExams(studentId: string): Promise<Exam[]> {
  const exams = await loadExams();
  return exams
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
}

export async function upsertStudent(student: Student): Promise<Student[]> {
  const list = await loadStudents();
  const idx = list.findIndex((s) => s.id === student.id);
  if (idx >= 0) list[idx] = student;
  else list.push(student);
  await saveStudents(list);
  return list;
}

export async function deleteStudent(id: string): Promise<Student[]> {
  const list = (await loadStudents()).filter((s) => s.id !== id);
  await saveStudents(list);
  const exams = (await loadExams()).filter((e) => e.studentId !== id);
  await saveExams(exams);
  return list;
}

export async function upsertExam(exam: Exam): Promise<Exam[]> {
  const list = await loadExams();
  const idx = list.findIndex((e) => e.id === exam.id);
  if (idx >= 0) list[idx] = exam;
  else list.push(exam);
  await saveExams(list);
  return list;
}

export async function deleteExam(id: string): Promise<Exam[]> {
  const list = (await loadExams()).filter((e) => e.id !== id);
  await saveExams(list);
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
