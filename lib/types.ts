// 학생 및 심사 결과 데이터 타입 정의
// 현재급수 (9급~1급 + 1~3품)
export type CurrentGrade =
  | "9급"
  | "8급"
  | "7급"
  | "6급"
  | "5급"
  | "4급"
  | "3급"
  | "2급"
  | "1급"
  | "1품"
  | "2품"
  | "3품";

// 응심급수 (36급~8급 짝수 + 7급~1급 전체)
export type TargetGrade =
  | "36급"
  | "34급"
  | "32급"
  | "30급"
  | "28급"
  | "26급"
  | "24급"
  | "22급"
  | "20급"
  | "18급"
  | "16급"
  | "14급"
  | "12급"
  | "10급"
  | "8급"
  | "7급"
  | "6급"
  | "5급"
  | "4급"
  | "3급"
  | "2급"
  | "1급";

// 하위 호환용 (기존 데이터)
export type Grade = CurrentGrade | TargetGrade;

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
}

export const CURRENT_GRADES: CurrentGrade[] = [
  "9급",
  "8급",
  "7급",
  "6급",
  "5급",
  "4급",
  "3급",
  "2급",
  "1급",
  "1품",
  "2품",
  "3품",
];

export const TARGET_GRADES: TargetGrade[] = [
  "36급",
  "34급",
  "32급",
  "30급",
  "28급",
  "26급",
  "24급",
  "22급",
  "20급",
  "18급",
  "16급",
  "14급",
  "12급",
  "10급",
  "8급",
  "7급",
  "6급",
  "5급",
  "4급",
  "3급",
  "2급",
  "1급",
];

// 하위 호환용
export const GRADES: Grade[] = [...CURRENT_GRADES, ...TARGET_GRADES];

export const RATING_GUIDE: Record<number, string> = {
  5: "매우 뛰어남",
  4: "잘하고 있어요",
  3: "성장 중입니다",
  2: "연습이 필요해요",
  1: "꾸준한 노력이 필요해요",
};
