"use client";

import { ArrowLeft, User, Calendar, Award, Phone } from "lucide-react";

interface AdminSidebarProps {
  activeTab: "students" | "vehicle" | "attendance" | "contacts";
  onTabChange: (tab: "students" | "vehicle" | "attendance" | "contacts") => void;
  onLogout?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-[220px] border-r border-line flex flex-col bg-white">
      {/* 로고/타이틀 */}
      <div className="p-6 border-b border-line">
        <div className="text-xs text-muted mb-1">ADMIN</div>
        <h1 className="text-lg font-bold text-ink">백호태권도</h1>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <button
            onClick={() => onTabChange("students")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "students"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <User size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">학생 관리</span>
          </button>
          <button
            onClick={() => onTabChange("vehicle")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "vehicle"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <Calendar size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">차량 관리</span>
          </button>
          <button
            onClick={() => onTabChange("attendance")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "attendance"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <Award size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">출석체크</span>
          </button>
          <button
            onClick={() => onTabChange("contacts")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "contacts"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <Phone size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">학부모 연락처</span>
          </button>
        </div>
      </nav>

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-line space-y-2">
        <a
          href="/"
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={14} />
          메인으로
        </a>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full px-3 py-2 text-sm border border-line text-muted hover:border-ink hover:text-ink rounded transition"
          >
            로그아웃
          </button>
        )}
      </div>
    </aside>
  );
}
