"use client";

"use client";

import { useState } from "react";
import AttendanceCheck from "./AttendanceCheck";
import AttendanceStudentsManagement from "./AttendanceStudentsManagement";
import MonthlyAttendance from "./MonthlyAttendance";
import PerfectAttendance from "./PerfectAttendance";

export default function AttendanceWithTabs() {
  const [subTab, setSubTab] = useState<"check" | "students" | "monthly" | "perfect">("check");

  return (
    <div>
      {/* 서브 탭 네비게이션 */}
      <div className="mb-6 flex gap-4 text-sm border-b border-line pb-2">
        <button
          onClick={() => setSubTab("check")}
          className={
            subTab === "check"
              ? "text-ink font-semibold border-b-2 border-point pb-0.5"
              : "text-muted hover:text-ink transition"
          }
        >
          출석체크
        </button>
        <button
          onClick={() => setSubTab("students")}
          className={
            subTab === "students"
              ? "text-ink font-semibold border-b-2 border-point pb-0.5"
              : "text-muted hover:text-ink transition"
          }
        >
          원생관리
        </button>
        <button
          onClick={() => setSubTab("monthly")}
          className={
            subTab === "monthly"
              ? "text-ink font-semibold border-b-2 border-point pb-0.5"
              : "text-muted hover:text-ink transition"
          }
        >
          월간출석부
        </button>
        <button
          onClick={() => setSubTab("perfect")}
          className={
            subTab === "perfect"
              ? "text-ink font-semibold border-b-2 border-point pb-0.5"
              : "text-muted hover:text-ink transition"
          }
        >
          출석왕
        </button>
      </div>

      {subTab === "check" && <AttendanceCheck />}
      {subTab === "students" && <AttendanceStudentsManagement />}
      {subTab === "monthly" && <MonthlyAttendance />}
      {subTab === "perfect" && <PerfectAttendance />}
    </div>
  );
}
