"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, Trophy } from "lucide-react";
import {
  getPerfectAttendanceStudents,
  calculateGrade,
  getGradeOrder,
} from "@/lib/storage";
import type { AttendanceStudent } from "@/lib/types";

export default function PerfectAttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const perfectStudents = await getPerfectAttendanceStudents(
        selectedYear,
        selectedMonth,
      );
      setStudents(perfectStudents);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 학년별 그룹화
  const groupedStudents = students.reduce(
    (acc, student) => {
      const grade = calculateGrade(student.birthYear);
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push({ ...student, grade });
      return acc;
    },
    {} as Record<string, Array<AttendanceStudent & { grade: string }>>,
  );

  const sortedGroups = Object.entries(groupedStudents).sort((a, b) => {
    return getGradeOrder(a[0]) - getGradeOrder(b[0]);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AttendanceHeader current="perfect" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={28} />
              출석왕
            </h1>
            <p className="text-sm text-muted">
              {selectedYear}년 {selectedMonth}월 완벽 출석자
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-input text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-input text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 p-4 rounded-full">
              <Award className="text-white" size={32} />
            </div>
            <div>
              <div className="text-3xl font-bold text-ink mb-1">
                {students.length}명
              </div>
              <div className="text-sm text-muted">
                {selectedYear}년 {selectedMonth}월 예정 등원일에 모두 출석한
                원생입니다.
              </div>
            </div>
          </div>
        </div>

        {/* 출석왕 명단 */}
        {students.length === 0 ? (
          <div className="border border-line p-8 text-center text-muted">
            {selectedMonth}월의 출석왕이 아직 없습니다.
            <br />
            월말이 되면 완벽 출석자가 자동으로 표시됩니다.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(([groupName, groupStudents]) => (
              <div key={groupName}>
                <h2 className="text-lg font-semibold text-ink mb-4">
                  {groupName} ({groupStudents.length}명)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupStudents
                    .sort((a, b) => parseInt(b.birthYear) - parseInt(a.birthYear))
                    .map((student) => (
                      <div
                        key={student.id}
                        className="border-2 border-yellow-300 bg-yellow-50 p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-yellow-400 text-white p-2 rounded-full shrink-0">
                            <Trophy size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-ink text-lg mb-1">
                              {student.name}
                            </div>
                            <div className="text-sm text-muted">
                              {student.birthYear}년생 · 등원 요일:{" "}
                              {student.attendanceDays.join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-8 text-xs text-muted border-t border-line pt-6">
          <p>
            <strong>출석왕 조건:</strong> 해당 월의 예정 등원일(등록된 등원
            요일)에 모두 출석한 원생이 자동으로 선정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function AttendanceHeader({ current }: { current: string }) {
  const router = useRouter();

  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-muted hover:text-ink transition"
          >
            ← 관리자 페이지
          </button>
          <div className="flex gap-4 text-sm">
            <button
              onClick={() => router.push("/attendance")}
              className={
                current === "check"
                  ? "text-ink font-semibold border-b-2 border-point pb-0.5"
                  : "text-muted hover:text-ink transition"
              }
            >
              출석체크
            </button>
            <button
              onClick={() => router.push("/attendance/students")}
              className={
                current === "students"
                  ? "text-ink font-semibold border-b-2 border-point pb-0.5"
                  : "text-muted hover:text-ink transition"
              }
            >
              원생관리
            </button>
            <button
              onClick={() => router.push("/attendance/monthly")}
              className={
                current === "monthly"
                  ? "text-ink font-semibold border-b-2 border-point pb-0.5"
                  : "text-muted hover:text-ink transition"
              }
            >
              월간출석부
            </button>
            <button
              onClick={() => router.push("/attendance/perfect")}
              className={
                current === "perfect"
                  ? "text-ink font-semibold border-b-2 border-point pb-0.5"
                  : "text-muted hover:text-ink transition"
              }
            >
              출석왕
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
