"use client";

import { forwardRef } from "react";
import type { Student, Exam } from "../lib/types";

interface Props {
  student: Student;
  exam: Exam;
}

// 미니멀 합격증 — 라인과 여백, 포인트 도장만
const Certificate = forwardRef<HTMLDivElement, Props>(({ student, exam }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-paper relative w-[800px] max-w-full aspect-[1.414/1] mx-auto p-12 sm:p-16 border border-ink"
      style={{ minHeight: 560 }}
    >
      {/* 헤더 */}
      <div className="text-center">
        <div className="text-xs text-muted tracking-widest">
          KNSU · BAEKHO TAEKWONDO
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink mt-3">
          심 사 합 격 증
        </h1>
        <div className="mx-auto mt-4 w-10 h-px bg-ink" />
      </div>

      {/* 본문 */}
      <div className="mt-10 grid grid-cols-3 gap-10 items-start">
        {/* 사진 */}
        <div className="col-span-1 flex justify-center">
          <div className="w-32 h-40 border border-line bg-paper flex items-center justify-center text-muted text-xs">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              "사 진"
            )}
          </div>
        </div>

        {/* 이름 / 본문 */}
        <div className="col-span-2">
          <div className="text-xs text-muted">성 명</div>
          <div className="text-3xl sm:text-4xl font-semibold text-ink mt-1 border-b border-ink pb-2">
            {student.name}
          </div>

          <p className="mt-7 text-ink text-base leading-loose">
            위 학생은 본 도장에서 시행한
            <span className="mx-1 font-semibold text-point">
              {exam.targetGrade}
            </span>
            승급 심사에 응시하여 그 기량과 태도가 우수함을 인정받아 이에
            합격하였음을 증명합니다.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <KV k="현재 급수" v={exam.currentGrade} />
            <KV k="응심 급수" v={exam.targetGrade} />
            <KV k="심사 일자" v={exam.examDate} />
            <KV k="합격 여부" v={exam.passed ? "합 격" : "재심사"} />
          </div>
        </div>
      </div>

      {/* 하단 */}
      <div className="absolute left-12 right-12 bottom-12 flex items-end justify-between">
        <div>
          <div className="text-xs text-muted">발 행 일</div>
          <div className="text-base font-semibold text-ink mt-0.5">
            {exam.examDate}
          </div>
          <div className="mt-3 text-xs text-muted">발 행 처</div>
          <div className="text-base font-semibold text-ink mt-0.5">
            한국체대 백호태권도
          </div>
        </div>

        {/* 합격 도장 — 단정한 라인 박스 + 포인트 컬러 */}
        <div className="border-2 border-point text-point font-semibold tracking-[0.3em] text-xl px-6 py-4">
          合 格
        </div>
      </div>
    </div>
  );
});

Certificate.displayName = "Certificate";
export default Certificate;

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted w-16 shrink-0">{k}</span>
      <span className="text-ink font-medium">{v}</span>
    </div>
  );
}
