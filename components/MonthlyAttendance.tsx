"use client";

import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import {
  loadAttendanceStudents,
  getAttendanceRecordsByMonth,
  calculateGrade,
  getGradeOrder,
} from "@/lib/storage";
import type { AttendanceStudent, AttendanceRecord, DayOfWeek } from "@/lib/types";

export default function MonthlyAttendance() {
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
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      dates.push({
        date: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        day: String(i),
        dayOfWeek: koreanDay || "",
      });
    }
  }

  const studentRows = students
    .map((student) => {
      const grade = calculateGrade(student.birthYear);
      const studentRecords = records.filter((r) => r.studentId === student.id);
      const attendanceMap: Record<
        string,
        { status: string; reason?: string }
      > = {};
      studentRecords.forEach((r) => {
        attendanceMap[r.date] = { status: r.status, reason: r.reason };
      });

      return { student, grade, attendanceMap };
    })
    .sort((a, b) => getGradeOrder(a.grade) - getGradeOrder(b.grade) || parseInt(b.student.birthYear) - parseInt(a.student.birthYear));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div>
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
            className="bg-point hover:bg-point-dark text-white px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition whitespace-nowrap"
          >
            <Printer size={16} />
            인쇄
          </button>
        </div>
      </div>

      <div className="print-only text-center mb-6">
        <p className="text-lg font-bold">
          {selectedYear}년 {selectedMonth}월
        </p>
      </div>

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
                  학년
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
              {studentRows.map(({ student, grade, attendanceMap }) => (
                <tr key={student.id}>
                  <td className="border border-line px-2 py-2 font-medium">
                    {student.name}
                  </td>
                  <td className="border border-line px-2 py-2 text-center text-xs">
                    {grade}
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
