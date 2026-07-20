import {
  Student,
  Exam,
  CurrentGrade,
  TargetGrade,
  AttendanceStudent,
  AttendanceRecord,
  VehicleSchedule,
  StudentVehicleInfo,
  VehicleStatus,
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

// 출생 연도로 학년 계산 (2019년생 = 1학년 기준)
export function calculateGrade(birthYear: string): string {
  const year = parseInt(birthYear, 10);
  if (isNaN(year)) return "미상";

  // 2019년생이 1학년 기준
  const grade = 2019 - year + 1;

  if (grade < 1) return "유치부";
  if (grade >= 1 && grade <= 6) return `${grade}학년`;
  return "중고등부";
}

// 학년 정렬 순서 계산
export function getGradeOrder(grade: string): number {
  if (grade === "유치부") return 0;
  if (grade === "중고등부") return 99;
  const match = grade.match(/(\d+)학년/);
  if (match) return parseInt(match[1], 10);
  return 100;
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
  birthYear: "",
  attendanceDays: [],
  createdAt: new Date().toISOString(),
});

// ─────────────────────────────────────────────
// 상장 생성용 헬퍼
// ─────────────────────────────────────────────

// 학생의 현재 급수 조회
export async function getStudentCurrentGrade(
  studentId: string,
): Promise<CurrentGrade> {
  // 1. Student 데이터에 currentGrade가 있으면 그것 사용
  const student = await findStudent(studentId);
  if (student?.currentGrade) {
    return student.currentGrade;
  }

  // 2. 없으면 가장 최근 합격 심사의 targetGrade 사용
  const exams = await getStudentExams(studentId);
  const passedExams = exams.filter((e) => e.passed);

  if (passedExams.length > 0) {
    return passedExams[0].targetGrade;
  }

  // 3. 둘 다 없으면 기본 9급
  return "9급" as CurrentGrade;
}

// ─────────────────────────────────────────────
// 차량 게시물 관리 (vehicleSchedules)
// ─────────────────────────────────────────────
let vehicleSchedulesCache: VehicleSchedule[] | null = null;
let vehicleSchedulesCachedAt = 0;

function invalidateVehicleSchedulesCache() {
  vehicleSchedulesCache = null;
  vehicleSchedulesCachedAt = 0;
}

export async function loadVehicleSchedules(
  force = false,
): Promise<VehicleSchedule[]> {
  if (
    !force &&
    vehicleSchedulesCache !== null &&
    Date.now() - vehicleSchedulesCachedAt < CACHE_TTL
  ) {
    return vehicleSchedulesCache;
  }
  try {
    const res = await fetch("/api/vehicle?type=schedules", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return vehicleSchedulesCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as VehicleSchedule[]) : [];
    vehicleSchedulesCache = list;
    vehicleSchedulesCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadVehicleSchedules]", e);
    return vehicleSchedulesCache ?? [];
  }
}

export async function upsertVehicleSchedule(
  schedule: VehicleSchedule,
): Promise<VehicleSchedule[]> {
  const base = vehicleSchedulesCache ?? (await loadVehicleSchedules());
  const next = [...base];
  const idx = next.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) next[idx] = schedule;
  else next.push(schedule);

  let res: Response;
  try {
    res = await fetch(
      `/api/vehicle?type=schedules&id=${encodeURIComponent(schedule.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      },
    );
  } catch (e) {
    invalidateVehicleSchedulesCache();
    console.error("[upsertVehicleSchedule] network error", e);
    throw new Error("차량 게시물 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateVehicleSchedulesCache();
    console.error("[upsertVehicleSchedule] HTTP", res.status, txt);
    throw new Error(`차량 게시물 저장 실패 (${res.status})`);
  }

  vehicleSchedulesCache = next;
  vehicleSchedulesCachedAt = Date.now();
  return next;
}

export async function deleteVehicleSchedule(
  id: string,
): Promise<VehicleSchedule[]> {
  const base = vehicleSchedulesCache ?? (await loadVehicleSchedules());
  const next = base.filter((s) => s.id !== id);

  let res: Response;
  try {
    res = await fetch(
      `/api/vehicle?type=schedules&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (e) {
    invalidateVehicleSchedulesCache();
    console.error("[deleteVehicleSchedule] network error", e);
    throw new Error("차량 게시물 삭제 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateVehicleSchedulesCache();
    console.error("[deleteVehicleSchedule] HTTP", res.status, txt);
    throw new Error(`차량 게시물 삭제 실패 (${res.status})`);
  }

  vehicleSchedulesCache = next;
  vehicleSchedulesCachedAt = Date.now();
  return next;
}

// ─────────────────────────────────────────────
// 원생별 차량 정보 (studentVehicles)
// ─────────────────────────────────────────────
let studentVehiclesCache: StudentVehicleInfo[] | null = null;
let studentVehiclesCachedAt = 0;

function invalidateStudentVehiclesCache() {
  studentVehiclesCache = null;
  studentVehiclesCachedAt = 0;
}

export async function loadStudentVehicles(
  force = false,
): Promise<StudentVehicleInfo[]> {
  if (
    !force &&
    studentVehiclesCache !== null &&
    Date.now() - studentVehiclesCachedAt < CACHE_TTL
  ) {
    return studentVehiclesCache;
  }
  try {
    const res = await fetch("/api/vehicle?type=students", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return studentVehiclesCache ?? [];
    const data = await res.json();
    const list = Array.isArray(data) ? (data as StudentVehicleInfo[]) : [];
    studentVehiclesCache = list;
    studentVehiclesCachedAt = Date.now();
    return list;
  } catch (e) {
    console.error("[loadStudentVehicles]", e);
    return studentVehiclesCache ?? [];
  }
}

export async function upsertStudentVehicle(
  vehicle: StudentVehicleInfo,
): Promise<StudentVehicleInfo[]> {
  const base = studentVehiclesCache ?? (await loadStudentVehicles());
  const next = [...base];
  const idx = next.findIndex((v) => v.id === vehicle.id);
  if (idx >= 0) next[idx] = vehicle;
  else next.push(vehicle);

  let res: Response;
  try {
    res = await fetch(
      `/api/vehicle?type=students&id=${encodeURIComponent(vehicle.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
      },
    );
  } catch (e) {
    invalidateStudentVehiclesCache();
    console.error("[upsertStudentVehicle] network error", e);
    throw new Error("차량 정보 저장 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateStudentVehiclesCache();
    console.error("[upsertStudentVehicle] HTTP", res.status, txt);
    throw new Error(`차량 정보 저장 실패 (${res.status})`);
  }

  studentVehiclesCache = next;
  studentVehiclesCachedAt = Date.now();
  return next;
}

export async function deleteStudentVehicle(
  id: string,
): Promise<StudentVehicleInfo[]> {
  const base = studentVehiclesCache ?? (await loadStudentVehicles());
  const next = base.filter((v) => v.id !== id);

  let res: Response;
  try {
    res = await fetch(
      `/api/vehicle?type=students&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (e) {
    invalidateStudentVehiclesCache();
    console.error("[deleteStudentVehicle] network error", e);
    throw new Error("차량 정보 삭제 실패: 네트워크 오류");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    invalidateStudentVehiclesCache();
    console.error("[deleteStudentVehicle] HTTP", res.status, txt);
    throw new Error(`차량 정보 삭제 실패 (${res.status})`);
  }

  studentVehiclesCache = next;
  studentVehiclesCachedAt = Date.now();
  return next;
}

// ─────────────────────────────────────────────
// 차량 조회 헬퍼 함수
// ─────────────────────────────────────────────

// 이름과 생년월일로 차량 정보 조회
export async function findVehicleInfoByNameAndBirthDate(
  name: string,
  birthDate: string,
): Promise<StudentVehicleInfo[]> {
  const vehicleList = await loadStudentVehicles();
  const target = name.trim().toLowerCase();

  // 이름과 생년월일이 모두 일치하는 차량 정보 필터링
  const matchedVehicles = vehicleList.filter(
    (v) =>
      v.studentName.trim().toLowerCase() === target &&
      v.birthDate === birthDate
  );

  return matchedVehicles;
}

// 특정 게시물의 차량 정보 조회 (게시물 ID 기준)
export async function getVehiclesByScheduleId(
  scheduleId: string,
): Promise<StudentVehicleInfo[]> {
  const list = await loadStudentVehicles();
  return list.filter((v) => v.scheduleId === scheduleId);
}

// 차량 게시물 상태 계산 (오늘 날짜 기준)
export function getVehicleStatus(
  startDate: string,
  endDate: string,
): VehicleStatus {
  const today = new Date().toISOString().split("T")[0];

  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

// 차량 게시물 템플릿
export const newVehicleScheduleTemplate = (id?: string): VehicleSchedule => ({
  id: id || `vehicle-schedule-${Date.now()}`,
  title: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  notice: "",
  isPublished: true,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// 원생별 차량 정보 템플릿
export const newStudentVehicleTemplate = (
  scheduleId: string,
  studentId: string,
  studentName: string,
  birthDate: string,
  id?: string,
): StudentVehicleInfo => ({
  id: id || `vehicle-student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  scheduleId,
  studentId,
  studentName,
  birthDate,
  pickupEnabled: true,
  pickupLocation: "",
  pickupTime: "",
  pickupVehicle: "",
  pickupManager: "",
  pickupNote: "",
  dropoffEnabled: true,
  dropoffLocation: "",
  dropoffTime: "",
  dropoffVehicle: "",
  dropoffManager: "",
  dropoffNote: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
