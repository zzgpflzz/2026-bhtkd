"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import {
  loadAttendanceStudents,
  getAttendanceRecordsByMonth,
  calculateAge,
} from "@/lib/storage";
import type { AttendanceStudent, AttendanceRecord, DayOfWeek } from "@/lib/types";

export default function MonthlyAttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
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
      const [allStudents, monthRecords] = await Promise.all([
        loadAttendanceStudents(true),
        getAttendanceRecordsByMonth(selectedYear, selectedMonth),
      ]);
      setStudents(allStudents);
      setRecords(monthRecords);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // 해당 월의 모든 날짜 생성
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dates: Array<{ date: string; day: string; dayOfWeek: string }> = [];

  const dayOfWeekMap: Record<number, DayOfWeek | "일"> = {
    0: "일",
    1: "월",
    2: "화",
    3: "수",
    4: "목",
    5: "금",
    6: "토",
  };

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(selectedYear, selectedMonth - 1, i);
    const dayOfWeek = date.getDay();
    const koreanDay = dayOfWeekMap[dayOfWeek];
    // 평일 + 토요일 (월~토)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      dates.push({
        date: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        day: String(i),
        dayOfWeek: koreanDay || "",
      });
    }
  }

  // 학생별 출석 데이터 매핑
  const studentRows = students
    .map((student) => {
      const age = calculateAge(student.birthDate);
      const studentRecords = records.filter((r) => r.studentId === student.id);
      const attendanceMap: Record<
        string,
        { status: string; reason?: string }
      > = {};
      studentRecords.forEach((r) => {
        attendanceMap[r.date] = { status: r.status, reason: r.reason };
      });

      return { student, age, attendanceMap };
    })
    .sort((a, b) => a.age - b.age);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AttendanceHeader current="monthly" />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* 헤더 (인쇄 시 숨김) */}
        <div className="mb-6 flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">
              월간 출석부
            </h1>
            <p className="text-sm text-muted">
              {selectedYear}년 {selectedMonth}월
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
            <button
              onClick={handlePrint}
              className="bg-point hover:bg-point-dark text-white px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <Printer size={16} />
              인쇄
            </button>
          </div>
        </div>

        {/* 인쇄용 헤더 (화면에는 숨김) */}
        <div className="print-only text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">백호태권도 월간 출석부</h1>
          <p className="text-lg">
            {selectedYear}년 {selectedMonth}월
          </p>
        </div>

        {/* 출석표 */}
        {students.length === 0 ? (
          <div className="border border-line p-8 text-center text-muted no-print">
            등록된 원생이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-line px-2 py-2 text-left font-semibold">
                    이름
                  </th>
                  <th className="border border-line px-2 py-2 text-center font-semibold">
                    나이
                  </th>
                  <th className="border border-line px-2 py-2 text-center font-semibold">
                    등원요일
                  </th>
                  {dates.map((d) => (
                    <th
                      key={d.date}
                      className="border border-line px-1 py-2 text-center font-semibold"
                    >
                      {d.day}
                      <br />({d.dayOfWeek})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map(({ student, age, attendanceMap }) => (
                  <tr key={student.id}>
                    <td className="border border-line px-2 py-2 font-medium">
                      {student.name}
                    </td>
                    <td className="border border-line px-2 py-2 text-center">
                      {age}
                    </td>
                    <td className="border border-line px-2 py-2 text-center text-[10px]">
                      {student.attendanceDays.join(",")}
                    </td>
                    {dates.map((d) => {
                      const record = attendanceMap[d.date];
                      const isScheduled = student.attendanceDays.includes(
                        d.dayOfWeek as DayOfWeek,
                      );

                      let cellContent = "";
                      let cellClass = "border border-line px-1 py-2 text-center";

                      if (!isScheduled) {
                        // 등원 예정 아님
                        cellClass += " bg-gray-50 text-gray-400";
                        cellContent = "-";
                      } else if (record) {
                        if (record.status === "present") {
                          cellClass += " bg-green-100 text-green-700";
                          cellContent = "O";
                        } else {
                          cellClass += " bg-red-100 text-red-700";
                          cellContent = "X";
                        }
                      } else {
                        // 기록 없음
                        cellClass += " bg-white";
                        cellContent = "";
                      }

                      return (
                        <td key={d.date} className={cellClass} title={record?.reason}>
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 범례 */}
        <div className="mt-6 flex gap-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
            <span>출석 (O)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
            <span>결석 (X)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300"></div>
            <span>등원 예정 없음 (-)</span>
          </div>
        </div>
      </div>

      {/* 인쇄용 CSS */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}

function AttendanceHeader({ current }: { current: string }) {
  const router = useRouter();

  return (
    <header className="border-b border-line bg-white no-print">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
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
