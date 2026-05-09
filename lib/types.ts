// 학생 및 심사 결과 데이터 타입 정의
export type Grade =
  | "10급"
  | "9급"
  | "8급"
  | "7급"
  | "6급"
  | "5급"
  | "4급"
  | "3급"
  | "2급"
  | "1급"
  | "품";

export interface BasicSkillRating {
  basics: number;           // 기본기
  poomsae: number;         // 품새
  sparring: number;        // 겨루기(연결발차기)
  breaking: number;        // 기술발차기(격파)
}

export interface AttitudeRating {
  concentration: number;    // 집중력
  challenge: number;        // 도전정신
  greeting: number;        // 인사성
  confidence: number;      // 자신감
}

export interface LifeHabitRating {
  uniform: number;         // 복장상태
  language: number;        // 바른 언어 사용
  organization: number;    // 정리 정돈
  rules: number;          // 규칙 준수
}

export interface Exam {
  id: string;
  studentId: string;
  examDate: string;        // YYYY-MM-DD
  currentGrade: Grade;
  targetGrade: Grade;
  basicSkills: BasicSkillRating;
  attitude: AttitudeRating;
  lifeHabits: LifeHabitRating;
  comment: string;
  passed: boolean;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;       // YYYY-MM-DD (로그인 비밀번호 역할)
  photoUrl?: string;       // 학생 사진 (URL 또는 dataURL)
  googleLink?: string;     // 구글 리포트 링크
  isEnglishName?: boolean; // 영어 이름 여부 (true면 성 제거 안함)
}

export const GRADES: Grade[] = [
  "10급", "9급", "8급", "7급", "6급",
  "5급", "4급", "3급", "2급", "1급", "품",
];

export const RATING_GUIDE: Record<number, string> = {
  5: "매우 뛰어남",
  4: "잘하고 있어요",
  3: "성장 중입니다",
  2: "연습이 필요해요",
  1: "꾸준한 노력이 필요해요",
};
