"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Users } from "lucide-react";
import {
  loadAttendanceStudents,
  loadAttendanceRecords,
  bulkUpsertAttendanceRecords,
  calculateGrade,
  getGradeOrder,
} from "@/lib/storage";
import type { AttendanceStudent, AttendanceRecord, DayOfWeek } from "@/lib/types";

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<Set<string>>(new Set());
  const [absentReasons, setAbsentReasons] = useState<Record<string, string>>({});
  const [gradeFilter, setGradeFilter] = useState<string>("전체");

  const today = new Date().toISOString().split("T")[0];
  const todayDayOfWeek = (() => {
    const day = new Date().getDay();
    const map: Record<number, DayOfWeek> = {
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토",
    };
    return map[day];
  })();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allStudents, allRecords] = await Promise.all([
        loadAttendanceStudents(true),
        loadAttendanceRecords(true),
      ]);

      // 오늘 등원 예정인 원생만 필터링
      const todayStudents = allStudents.filter((s) =>
        todayDayOfWeek ? s.attendanceDays.includes(todayDayOfWeek) : false,
      );
      setStudents(todayStudents);

      // 오늘 출석 기록
      const todayRecs = allRecords.filter((r) => r.date === today);
      setTodayRecords(todayRecs);

      // 이미 결석 처리된 원생 표시
      const absent = new Set(
        todayRecs.filter((r) => r.status === "absent").map((r) => r.studentId),
      );
      setAbsentStudents(absent);

      const reasons: Record<string, string> = {};
      todayRecs.forEach((r) => {
        if (r.status === "absent" && r.reason) {
          reasons[r.studentId] = r.reason;
        }
      });
      setAbsentReasons(reasons);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAbsent(studentId: string) {
    setAbsentStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
        // 사유도 제거
        setAbsentReasons((r) => {
          const { [studentId]: _, ...rest } = r;
          return rest;
        });
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  function setReason(studentId: string, reason: string) {
    setAbsentReasons((prev) => ({ ...prev, [studentId]: reason }));
  }

  async function handleBulkSubmit() {
    if (!todayDayOfWeek) {
      alert("일요일에는 출석체크를 할 수 없습니다.");
      return;
    }

    // 결석 원생 중 사유 미입력 확인
    const missingReason = Array.from(absentStudents).find(
      (id) => !absentReasons[id]?.trim(),
    );
    if (missingReason) {
      alert("결석 사유를 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const records: AttendanceRecord[] = students.map((student) => {
        const isAbsent = absentStudents.has(student.id);
        return {
          id: `${student.id}-${today}`,
          studentId: student.id,
          date: today,
          status: isAbsent ? "absent" : "present",
          reason: isAbsent ? absentReasons[student.id] : undefined,
          recordedAt: new Date().toISOString(),
        };
      });

      await bulkUpsertAttendanceRecords(records);
      alert("출석체크가 완료되었습니다.");
      await loadData();
    } catch (error) {
      console.error("출석 저장 실패:", error);
      alert("출석 저장에 실패했습니다.");
    } finally {
      setSaving(false);
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

  // 학년 필터 적용
  const filteredGroups = Object.entries(groupedStudents).filter(([grade]) => {
    if (gradeFilter === "전체") return true;
    return grade === gradeFilter;
  });

  const sortedGroups = filteredGroups.sort((a, b) => {
    return getGradeOrder(a[0]) - getGradeOrder(b[0]);
  });

  // 필터 옵션 생성
  const gradeOptions = ["전체", ...Object.keys(groupedStudents).sort((a, b) => getGradeOrder(a) - getGradeOrder(b))];

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!todayDayOfWeek) {
    return (
      <div className="min-h-screen bg-paper">
        <AttendanceHeader />
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="text-lg text-muted">
            일요일에는 출석체크를 할 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AttendanceHeader />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">
              오늘의 출석체크
            </h1>
            <p className="text-sm text-muted">
              {today} ({todayDayOfWeek}요일) · 등원 예정 {students.length}명
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">학년 필터:</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="form-input text-sm py-1.5"
            >
              {gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="border border-line p-8 text-center text-muted">
            오늘 등원 예정인 원생이 없습니다.
          </div>
        ) : (
          <>
            {/* 나이대별 그룹 */}
            <div className="space-y-8 mb-8">
              {sortedGroups.map(([groupName, groupStudents]) => (
                <div key={groupName}>
                  <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Users size={20} />
                    {groupName} ({groupStudents.length}명)
                  </h2>
                  <div className="space-y-3">
                    {groupStudents
                      .sort((a, b) => parseInt(b.birthYear) - parseInt(a.birthYear))
                      .map((student) => {
                        const isAbsent = absentStudents.has(student.id);
                        const alreadyRecorded = todayRecords.some(
                          (r) => r.studentId === student.id,
                        );
                        return (
                          <div
                            key={student.id}
                            className={`border ${
                              isAbsent
                                ? "border-red-300 bg-red-50"
                                : "border-line bg-white"
                            } p-4 transition`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                type="button"
                                onClick={() => toggleAbsent(student.id)}
                                className={`mt-1 shrink-0 ${
                                  isAbsent
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {isAbsent ? (
                                  <XCircle size={24} />
                                ) : (
                                  <CheckCircle2 size={24} />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-ink">
                                    {student.name}
                                  </span>
                                  <span className="text-xs text-muted">
                                    {student.birthYear}년생
                                  </span>
                                  {alreadyRecorded && (
                                    <span className="text-xs bg-gray-200 px-2 py-1">
                                      기록됨
                                    </span>
                                  )}
                                </div>
                                {isAbsent && (
                                  <div className="mt-2">
                                    <label className="block text-xs text-muted mb-1">
                                      결석 사유
                                    </label>
                                    <input
                                      type="text"
                                      value={absentReasons[student.id] || ""}
                                      onChange={(e) =>
                                        setReason(student.id, e.target.value)
                                      }
                                      placeholder="예) 감기, 가족 행사 등"
                                      className="form-input w-full max-w-md"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* 일괄 처리 버튼 */}
            <div className="border-t border-line pt-6">
              <button
                onClick={handleBulkSubmit}
                disabled={saving}
                className="w-full bg-point hover:bg-point-dark text-white font-semibold py-4 transition disabled:opacity-50"
              >
                {saving ? "저장 중..." : "출석 체크 완료 (일괄 저장)"}
              </button>
              <p className="text-xs text-muted text-center mt-3">
                체크하지 않은 원생은 모두 출석으로 처리됩니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AttendanceHeader() {
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
              className="text-ink font-semibold border-b-2 border-point pb-0.5"
            >
              출석체크
            </button>
            <button
              onClick={() => router.push("/attendance/students")}
              className="text-muted hover:text-ink transition"
            >
              원생관리
            </button>
            <button
              onClick={() => router.push("/attendance/monthly")}
              className="text-muted hover:text-ink transition"
            >
              월간출석부
            </button>
            <button
              onClick={() => router.push("/attendance/perfect")}
              className="text-muted hover:text-ink transition"
            >
              출석왕
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
