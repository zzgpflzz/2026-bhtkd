// 학생 및 심사 결과 데이터 타입 정의
export type PoomCategory = "유급" | "1품" | "2품" | "3품";

export type Grade =
  // 유급 (9급~1급)
  | "9급"
  | "8급"
  | "7급"
  | "6급"
  | "5급"
  | "4급"
  | "3급"
  | "2급"
  | "1급"
  // 1품 (0급, 2의 배수, 2급~12급)
  | "1품 0급"
  | "1품 2급"
  | "1품 4급"
  | "1품 6급"
  | "1품 8급"
  | "1품 10급"
  | "1품 12급"
  // 2품 (0급, 2의 배수, 2급~24급)
  | "2품 0급"
  | "2품 2급"
  | "2품 4급"
  | "2품 6급"
  | "2품 8급"
  | "2품 10급"
  | "2품 12급"
  | "2품 14급"
  | "2품 16급"
  | "2품 18급"
  | "2품 20급"
  | "2품 22급"
  | "2품 24급"
  // 3품 (0급, 2의 배수, 2급~36급)
  | "3품 0급"
  | "3품 2급"
  | "3품 4급"
  | "3품 6급"
  | "3품 8급"
  | "3품 10급"
  | "3품 12급"
  | "3품 14급"
  | "3품 16급"
  | "3품 18급"
  | "3품 20급"
  | "3품 22급"
  | "3품 24급"
  | "3품 26급"
  | "3품 28급"
  | "3품 30급"
  | "3품 32급"
  | "3품 34급"
  | "3품 36급";

// 하위 호환용
export type CurrentGrade = Grade;
export type TargetGrade = Grade;

export const GRADES_BY_CATEGORY: Record<PoomCategory, Grade[]> = {
  유급: ["9급", "8급", "7급", "6급", "5급", "4급", "3급", "2급", "1급"],
  "1품": ["1품 0급", "1품 2급", "1품 4급", "1품 6급", "1품 8급", "1품 10급", "1품 12급"],
  "2품": [
    "2품 0급",
    "2품 2급",
    "2품 4급",
    "2품 6급",
    "2품 8급",
    "2품 10급",
    "2품 12급",
    "2품 14급",
    "2품 16급",
    "2품 18급",
    "2품 20급",
    "2품 22급",
    "2품 24급",
  ],
  "3품": [
    "3품 0급",
    "3품 2급",
    "3품 4급",
    "3품 6급",
    "3품 8급",
    "3품 10급",
    "3품 12급",
    "3품 14급",
    "3품 16급",
    "3품 18급",
    "3품 20급",
    "3품 22급",
    "3품 24급",
    "3품 26급",
    "3품 28급",
    "3품 30급",
    "3품 32급",
    "3품 34급",
    "3품 36급",
  ],
};

export interface BasicSkillRating {
  basics: number; // 기본기
  poomsae: number; // 품새
  sparring: number; // 겨루기(연결발차기)
  breaking: number; // 기술발차기(격파)
}

export interface AttitudeRating {
  concentration: number; // 집중력
  challenge: number; // 도전정신
  greeting: number; // 인사성
  confidence: number; // 자신감
}

export interface LifeHabitRating {
  uniform: number; // 복장상태
  language: number; // 바른 언어 사용
  organization: number; // 정리 정돈
  rules: number; // 규칙 준수
}

export interface Exam {
  id: string;
  studentId: string;
  examDate: string; // YYYY-MM-DD
  currentGrade: CurrentGrade;
  targetGrade: TargetGrade;
  basicSkills: BasicSkillRating;
  attitude: AttitudeRating;
  lifeHabits: LifeHabitRating;
  comment: string;
  passed: boolean;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD (로그인 비밀번호 역할)
  photoUrl?: string; // 학생 사진 (URL 또는 dataURL)
  googleLink?: string; // 구글 리포트 링크
  isEnglishName?: boolean; // 영어 이름 여부 (true면 성 제거 안함)
  hasBlackBelt?: boolean; // 유품자 여부 (admin 전용)
  isColorBelt?: boolean; // 유급자 여부 (admin 전용)
  currentGrade?: Grade; // 현재 급수 (상장 생성용)
}

export const CURRENT_GRADES: Grade[] = Object.values(GRADES_BY_CATEGORY).flat();
export const TARGET_GRADES: Grade[] = Object.values(GRADES_BY_CATEGORY).flat();
export const GRADES: Grade[] = Object.values(GRADES_BY_CATEGORY).flat();

export const POOM_CATEGORIES: PoomCategory[] = ["유급", "1품", "2품", "3품"];

export const RATING_GUIDE: Record<number, string> = {
  5: "매우 뛰어남",
  4: "잘하고 있어요",
  3: "성장 중입니다",
  2: "연습이 필요해요",
  1: "꾸준한 노력이 필요해요",
};

// ─────────────────────────────────────────────
// 출석체크 시스템 타입 정의
// ─────────────────────────────────────────────

export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토";

export interface AttendanceStudent {
  id: string;
  name: string;
  birthYear: string; // YYYY (출생 연도, 학년 자동 계산용)
  attendanceDays: DayOfWeek[]; // 등원 요일 (복수 선택 가능)
  createdAt: string; // ISO 8601
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  reason?: string; // 결석 사유 (결석일 때만)
  recordedAt: string; // ISO 8601
}

// ─────────────────────────────────────────────
// 차량 등하원 시스템 타입 정의
// ─────────────────────────────────────────────

export type VehicleStatus = "upcoming" | "active" | "completed";

export interface VehicleSchedule {
  id: string;
  title: string; // 게시물 제목 (예: "2026년 여름방학 차량")
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notice?: string; // 안내사항
  isPublished: boolean; // 공개 여부
  displayOrder?: number; // 노출 순서 (낮을수록 우선)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface StudentVehicleInfo {
  id: string;
  scheduleId: string; // 차량 게시물 ID
  studentId: string; // 학생 ID
  studentName: string; // 학생 이름 (중복 저장)
  birthDate: string; // 생년월일 (중복 저장, 조회용)

  // 등원 정보
  pickupEnabled: boolean; // 등원 차량 이용 여부
  pickupLocation?: string; // 등원 장소
  pickupTime?: string; // 등원 시간
  pickupVehicle?: string; // 등원 차량명
  pickupManager?: string; // 등원 담당자
  pickupNote?: string; // 등원 비고

  // 하원 정보
  dropoffEnabled: boolean; // 하원 차량 이용 여부
  dropoffLocation?: string; // 하원 장소
  dropoffTime?: string; // 하원 시간
  dropoffVehicle?: string; // 하원 차량명
  dropoffManager?: string; // 하원 담당자
  dropoffNote?: string; // 하원 비고

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
