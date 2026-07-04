import { Grade, GRADES } from "./types";

/**
 * 급수별 띠 색상 매핑
 */
const BELT_COLORS: Record<string, string> = {
  "9급": "흰띠",
  "8급": "노란띠",
  "7급": "초록띠",
  "6급": "파란띠",
  "5급": "밤띠",
  "4급": "보라띠",
  "3급": "주황띠",
  "2급": "빨강띠",
  "1급": "빨강띠",
};

/**
 * 급수에 띠 색상 추가
 * 예: "9급" → "9급 흰띠", "1품 2급" → "1품 2급" (유품은 그대로)
 */
export function getGradeWithBelt(grade: Grade): string {
  const beltColor = BELT_COLORS[grade];
  return beltColor ? `${grade} ${beltColor}` : grade;
}

/**
 * 다음 급수 계산
 * 예: 9급 → 8급, 1급 → 1품 2급, 1품 12급 → 2품 2급
 */
export function getNextGrade(currentGrade: Grade): Grade {
  const currentIndex = GRADES.indexOf(currentGrade);

  if (currentIndex === -1) {
    // 급수를 찾을 수 없으면 그대로 반환
    return currentGrade;
  }

  if (currentIndex === GRADES.length - 1) {
    // 최고 급수(3품 36급)면 그대로
    return currentGrade;
  }

  // 다음 급수 반환
  return GRADES[currentIndex + 1];
}

/**
 * 오늘 날짜를 한글 형식으로 반환
 * 예: "2026년 7월 4일"
 */
export function formatToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 한글 형식으로 변환
 * 예: "2026-07-04" → "2026년 7월 4일"
 */
export function formatDateKorean(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}
