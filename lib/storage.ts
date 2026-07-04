import {
  Student,
  Exam,
  CurrentGrade,
  TargetGrade,
  AttendanceStudent,
  AttendanceRecord,
} from "@/lib/types";

// ─────────────────────────────────────────────
// 클라이언트 캐시 (students / exams 완전 분리)
// ─────────────────────────────────────────────
let studentsCache: Student[] | null = null;
let examsCache: Exam[] | null = null;
let studentsCachedAt = 0;
let examsCachedAt = 0;
const CACHE_TTL = 30_000; // 30초

export function clearCache() {
  studentsCache = null;
  examsCache = null;
  studentsCachedAt = 0;
  examsCachedAt = 0;
}

// 백그라운드 저장 실패 시 다음 요청에서 강제 재조회
function invalidateStudentsCache() {
  studentsCache = null;
  studentsCachedAt = 0;
}
function invalidateExamsCache() {
  examsCache = null;
  examsCachedAt = 0;
}

// ─────────────────────────────────────────────
// 학생
// ─────────────────────────────────────────────
export async function loadStudents(force = false): Promise<Student[]> {
  if (
    !force &&
    studentsCache !== null &&
    Date.now() - studentsCachedAt < CACHE_TTL
  ) {
    return studentsCache;
  }
  try {
    const res = await fetch("/api/storage?type=students", {
      next: { revalidate: 30 }, // 30초 캐싱
      // force-cache 제거 — 오래된 캐시로 데이터 안 보이는 문제 해결
    });
    if (!res.ok) return studentsCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as Student[]) : [];
    studentsCache = list;
    studentsCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadStudents]", e);
    return studentsCache ?? [];
  }
}

export async function upsertStudent(student: Student): Promise<Student[]> {
  // 다음 상태 계산 (캐시 기준)
  const base = studentsCache ?? (await loadStudents());
  const next = [...base];
  const idx = next.findIndex((s) => s.id === student.id);
  if (idx >= 0) next[idx] = student;
  else next.push(student);

  // 서버에 저장 — Firestore 응답이 올 때까지 await로 보장
  let res: Response;
  try {
    res = await fetch(
      `/api/storage?type=students&id=${encodeURIComponent(student.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      },
    );
  } catch (e) {
    invalidateStudentsCache();
    console.error("[upsertStudent] network error", e);
    throw new Error("학생 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateStudentsCache();
    console.error("[upsertStudent] HTTP", res.status, txt);
    throw new Error(`학생 저장 실패 (${res.status})`);
  }

  // 저장 성공 시에만 캐시 갱신
  studentsCache = next;
  studentsCachedAt = Date.now();
  return next;
}

export async function deleteStudent(id: string): Promise<Student[]> {
  const base = studentsCache ?? (await loadStudents());
  const next = base.filter((s) => s.id !== id);

  let res: Response;
  try {
    res = await fetch(
      `/api/storage?type=students&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (e) {
    invalidateStudentsCache();
    invalidateExamsCache();
    console.error("[deleteStudent] network error", e);
    throw new Error("학생 삭제 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateStudentsCache();
    invalidateExamsCache();
    console.error("[deleteStudent] HTTP", res.status, txt);
    throw new Error(`학생 삭제 실패 (${res.status})`);
  }

  studentsCache = next;
  studentsCachedAt = Date.now();
  if (examsCache) {
    examsCache = examsCache.filter((e) => e.studentId !== id);
  }
  return next;
}

// ─────────────────────────────────────────────
// 심사 (exam)
// ─────────────────────────────────────────────
export async function loadExams(force = false): Promise<Exam[]> {
  if (!force && examsCache !== null && Date.now() - examsCachedAt < CACHE_TTL) {
    return examsCache;
  }
  try {
    const res = await fetch("/api/storage?type=exams", {
      next: { revalidate: 30 }, // 30초로 통일 (기존 5초 → 너무 짧아서 Firestore 과호출)
    });
    if (!res.ok) return examsCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as Exam[]) : [];
    examsCache = list;
    examsCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadExams]", e);
    return examsCache ?? [];
  }
}

export async function upsertExam(exam: Exam): Promise<Exam[]> {
  const base = examsCache ?? (await loadExams());
  const next = [...base];
  const idx = next.findIndex((e) => e.id === exam.id);
  if (idx >= 0) next[idx] = exam;
  else next.push(exam);

  let res: Response;
  try {
    res = await fetch(
      `/api/storage?type=exams&id=${encodeURIComponent(exam.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exam),
      },
    );
  } catch (e) {
    invalidateExamsCache();
    console.error("[upsertExam] network error", e);
    throw new Error("심사 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateExamsCache();
    console.error("[upsertExam] HTTP", res.status, txt);
    throw new Error(`심사 저장 실패 (${res.status})`);
  }

  examsCache = next;
  examsCachedAt = Date.now();
  return next;
}

export async function deleteExam(id: string): Promise<Exam[]> {
  const base = examsCache ?? (await loadExams());
  const next = base.filter((e) => e.id !== id);

  let res: Response;
  try {
    res = await fetch(`/api/storage?type=exams&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (e) {
    invalidateExamsCache();
    console.error("[deleteExam] network error", e);
    throw new Error("심사 삭제 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateExamsCache();
    console.error("[deleteExam] HTTP", res.status, txt);
    throw new Error(`심사 삭제 실패 (${res.status})`);
  }

  examsCache = next;
  examsCachedAt = Date.now();
  return next;
}

// ─────────────────────────────────────────────
// 조회 헬퍼
// ─────────────────────────────────────────────
export async function findStudent(id: string): Promise<Student | null> {
  // 캐시 확인
  if (studentsCache) {
    const hit = studentsCache.find((s) => s.id === id);
    if (hit) return hit;
  }

  // 단일 문서 조회 (전체 리스트 대신)
  try {
    const res = await fetch(
      `/api/storage?type=students&id=${encodeURIComponent(id)}`,
      {
        next: { revalidate: 30 },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" ? (data as Student) : null;
  } catch (e) {
    console.error("[findStudent]", e);
    return null;
  }
}

export async function findStudentByNameAndBirthDate(
  name: string,
  birthDate: string,
): Promise<Student | null> {
  const list = await loadStudents();
  const target = name.trim().toLowerCase();
  return (
    list.find(
      (s) =>
        s.name.trim().toLowerCase() === target && s.birthDate === birthDate,
    ) ?? null
  );
}

export async function getStudentExams(studentId: string): Promise<Exam[]> {
  const list = await loadExams();
  return list
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => (a.examDate < b.examDate ? 1 : -1)); // 최근순
}

// ─────────────────────────────────────────────
// 템플릿
// ─────────────────────────────────────────────
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
  currentGrade: "9급" as CurrentGrade,
  targetGrade: "36급" as TargetGrade,
  basicSkills: { basics: 0, poomsae: 0, sparring: 0, breaking: 0 },
  attitude: { concentration: 0, challenge: 0, greeting: 0, confidence: 0 },
  lifeHabits: { uniform: 0, language: 0, organization: 0, rules: 0 },
  comment: "",
  passed: false,
});

// ─────────────────────────────────────────────
// 사진 업로드용 헬퍼 — 클라이언트에서 호출
// dataURL을 받아 캔버스로 800x800 이내로 리사이즈 + jpeg 압축
// ─────────────────────────────────────────────
export async function compressImageDataURL(
  file: File,
  maxSize = 800,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context 생성 실패"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        // jpeg 압축으로 크기 안정화
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
// Firebase Storage에 이미지 업로드 (base64 → public URL)
// ─────────────────────────────────────────────
export async function uploadImageToStorage(
  dataUrl: string,
  studentId: string,
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, studentId }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`이미지 업로드 실패: ${error}`);
  }

  const data = await res.json();
  return data.url;
}

// ─────────────────────────────────────────────
// 출석체크 원생 관리 (attendanceStudents)
// ─────────────────────────────────────────────
let attendanceStudentsCache: AttendanceStudent[] | null = null;
let attendanceStudentsCachedAt = 0;

function invalidateAttendanceStudentsCache() {
  attendanceStudentsCache = null;
  attendanceStudentsCachedAt = 0;
}

export async function loadAttendanceStudents(
  force = false,
): Promise<AttendanceStudent[]> {
  if (
    !force &&
    attendanceStudentsCache !== null &&
    Date.now() - attendanceStudentsCachedAt < CACHE_TTL
  ) {
    return attendanceStudentsCache;
  }
  try {
    const res = await fetch("/api/attendance?type=students", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return attendanceStudentsCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as AttendanceStudent[]) : [];
    attendanceStudentsCache = list;
    attendanceStudentsCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadAttendanceStudents]", e);
    return attendanceStudentsCache ?? [];
  }
}

export async function upsertAttendanceStudent(
  student: AttendanceStudent,
): Promise<AttendanceStudent[]> {
  const base = attendanceStudentsCache ?? (await loadAttendanceStudents());
  const next = [...base];
  const idx = next.findIndex((s) => s.id === student.id);
  if (idx >= 0) next[idx] = student;
  else next.push(student);

  let res: Response;
  try {
    res = await fetch(
      `/api/attendance?type=students&id=${encodeURIComponent(student.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      },
    );
  } catch (e) {
    invalidateAttendanceStudentsCache();
    console.error("[upsertAttendanceStudent] network error", e);
    throw new Error("원생 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateAttendanceStudentsCache();
    console.error("[upsertAttendanceStudent] HTTP", res.status, txt);
    throw new Error(`원생 저장 실패 (${res.status})`);
  }

  attendanceStudentsCache = next;
  attendanceStudentsCachedAt = Date.now();
  return next;
}

export async function deleteAttendanceStudent(
  id: string,
): Promise<AttendanceStudent[]> {
  const base = attendanceStudentsCache ?? (await loadAttendanceStudents());
  const next = base.filter((s) => s.id !== id);

  let res: Response;
  try {
    res = await fetch(
      `/api/attendance?type=students&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (e) {
    invalidateAttendanceStudentsCache();
    console.error("[deleteAttendanceStudent] network error", e);
    throw new Error("원생 삭제 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateAttendanceStudentsCache();
    console.error("[deleteAttendanceStudent] HTTP", res.status, txt);
    throw new Error(`원생 삭제 실패 (${res.status})`);
  }

  attendanceStudentsCache = next;
  attendanceStudentsCachedAt = Date.now();
  return next;
}

// ─────────────────────────────────────────────
// 출석 기록 (attendanceRecords)
// ─────────────────────────────────────────────
let attendanceRecordsCache: AttendanceRecord[] | null = null;
let attendanceRecordsCachedAt = 0;

function invalidateAttendanceRecordsCache() {
  attendanceRecordsCache = null;
  attendanceRecordsCachedAt = 0;
}

export async function loadAttendanceRecords(
  force = false,
): Promise<AttendanceRecord[]> {
  if (
    !force &&
    attendanceRecordsCache !== null &&
    Date.now() - attendanceRecordsCachedAt < CACHE_TTL
  ) {
    return attendanceRecordsCache;
  }
  try {
    const res = await fetch("/api/attendance?type=records", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return attendanceRecordsCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as AttendanceRecord[]) : [];
    attendanceRecordsCache = list;
    attendanceRecordsCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadAttendanceRecords]", e);
    return attendanceRecordsCache ?? [];
  }
}

export async function upsertAttendanceRecord(
  record: AttendanceRecord,
): Promise<AttendanceRecord[]> {
  const base = attendanceRecordsCache ?? (await loadAttendanceRecords());
  const next = [...base];
  const idx = next.findIndex((r) => r.id === record.id);
  if (idx >= 0) next[idx] = record;
  else next.push(record);

  let res: Response;
  try {
    res = await fetch(
      `/api/attendance?type=records&id=${encodeURIComponent(record.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      },
    );
  } catch (e) {
    invalidateAttendanceRecordsCache();
    console.error("[upsertAttendanceRecord] network error", e);
    throw new Error("출석 기록 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateAttendanceRecordsCache();
    console.error("[upsertAttendanceRecord] HTTP", res.status, txt);
    throw new Error(`출석 기록 저장 실패 (${res.status})`);
  }

  attendanceRecordsCache = next;
  attendanceRecordsCachedAt = Date.now();
  return next;
}

export async function bulkUpsertAttendanceRecords(
  records: AttendanceRecord[],
): Promise<AttendanceRecord[]> {
  let res: Response;
  try {
    res = await fetch(`/api/attendance?type=records&bulk=true`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    });
  } catch (e) {
    invalidateAttendanceRecordsCache();
    console.error("[bulkUpsertAttendanceRecords] network error", e);
    throw new Error("일괄 출석 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateAttendanceRecordsCache();
    console.error("[bulkUpsertAttendanceRecords] HTTP", res.status, txt);
    throw new Error(`일괄 출석 저장 실패 (${res.status})`);
  }

  invalidateAttendanceRecordsCache();
  return await loadAttendanceRecords(true);
}

// ─────────────────────────────────────────────
// 출석체크 헬퍼 함수
// ─────────────────────────────────────────────

// 생년월일로 나이 계산 (한국 나이)
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  return age + 1; // 한국 나이
}

// 나이대 그룹 계산
export function getAgeGroup(age: number): string {
  if (age <= 7) return "유치부";
  if (age <= 10) return "초등 저학년";
  if (age <= 13) return "초등 고학년";
  return "중고등부";
}

// 특정 날짜의 출석 기록 조회
export async function getAttendanceRecordsByDate(
  date: string,
): Promise<AttendanceRecord[]> {
  const records = await loadAttendanceRecords();
  return records.filter((r) => r.date === date);
}

// 특정 월의 출석 기록 조회
export async function getAttendanceRecordsByMonth(
  year: number,
  month: number,
): Promise<AttendanceRecord[]> {
  const records = await loadAttendanceRecords();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return records.filter((r) => r.date.startsWith(prefix));
}

// 출석왕 계산 (해당 월에 예정 등원일 모두 출석)
export async function getPerfectAttendanceStudents(
  year: number,
  month: number,
): Promise<AttendanceStudent[]> {
  const students = await loadAttendanceStudents();
  const records = await getAttendanceRecordsByMonth(year, month);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfWeekMap: Record<number, string> = {
    1: "월",
    2: "화",
    3: "수",
    4: "목",
    5: "금",
    6: "토",
  };

  const perfectStudents: AttendanceStudent[] = [];

  for (const student of students) {
    // 해당 월에 예정된 등원일 계산
    const expectedDays: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const koreanDay = dayOfWeekMap[dayOfWeek];
        if (koreanDay && student.attendanceDays.includes(koreanDay as any)) {
          expectedDays.push(
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          );
        }
      }
    }

    if (expectedDays.length === 0) continue;

    // 실제 출석 기록 확인
    const studentRecords = records.filter((r) => r.studentId === student.id);
    const presentDays = studentRecords
      .filter((r) => r.status === "present")
      .map((r) => r.date);

    // 모든 예정일에 출석했는지 확인
    const isPerfect = expectedDays.every((day) => presentDays.includes(day));
    if (isPerfect) {
      perfectStudents.push(student);
    }
  }

  return perfectStudents;
}

export const newAttendanceStudentTemplate = (id?: string): AttendanceStudent => ({
  id: id || `att-student-${Date.now()}`,
  name: "",
  birthDate: "",
  attendanceDays: [],
  createdAt: new Date().toISOString(),
});
