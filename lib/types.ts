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
  // 1품 (2의 배수, 2급~12급)
  | "1품 2급"
  | "1품 4급"
  | "1품 6급"
  | "1품 8급"
  | "1품 10급"
  | "1품 12급"
  // 2품 (2의 배수, 2급~24급)
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
  // 3품 (2의 배수, 2급~36급)
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
  "1품": ["1품 2급", "1품 4급", "1품 6급", "1품 8급", "1품 10급", "1품 12급"],
  "2품": [
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
