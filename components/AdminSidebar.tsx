"use client";

import { useState } from "react";
import { ArrowLeft, User, Calendar, Award, Phone, MessageSquare, DollarSign, Menu, X, Trophy } from "lucide-react";

interface AdminSidebarProps {
  activeTab: "students" | "vehicle" | "attendance" | "contacts" | "consult" | "tuition" | "awards";
  onTabChange: (tab: "students" | "vehicle" | "attendance" | "contacts" | "consult" | "tuition" | "awards") => void;
  onLogout?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: AdminSidebarProps["activeTab"]) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 모바일 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-line z-40 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">ADMIN</div>
          <h1 className="text-sm font-bold text-ink">백호태권도</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-line-soft transition"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/40 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-[220px] border-r border-line flex flex-col bg-white
        transition-transform duration-300
        lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      {/* 로고/타이틀 (데스크톱만) */}
      <div className="hidden lg:block p-6 border-b border-line">
        <div className="text-xs text-muted mb-1">ADMIN</div>
        <h1 className="text-lg font-bold text-ink">백호태권도</h1>
      </div>

      {/* 모바일 닫기 버튼 */}
      <div className="lg:hidden p-4 border-b border-line flex items-center justify-between">
        <div>
          <div className="text-xs text-muted mb-1">ADMIN</div>
          <h1 className="text-lg font-bold text-ink">백호태권도</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="p-2 hover:bg-line-soft transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <button
            onClick={() => handleTabChange("students")}
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
            onClick={() => handleTabChange("vehicle")}
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
            onClick={() => handleTabChange("attendance")}
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
            onClick={() => handleTabChange("contacts")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "contacts"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <Phone size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">학부모 연락처</span>
          </button>
          <button
            onClick={() => handleTabChange("consult")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "consult"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <MessageSquare size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">학부모 상담일지</span>
          </button>
          <button
            onClick={() => handleTabChange("tuition")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "tuition"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <DollarSign size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">교육비 관리</span>
          </button>
          <button
            onClick={() => handleTabChange("awards")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition ${
              activeTab === "awards"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
            }`}
          >
            <Trophy size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">시상식</span>
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
    </>
  );
}
