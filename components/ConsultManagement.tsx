"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Edit3, Trash2, Save, X, Search, UserPlus } from "lucide-react";
import {
  loadConsultRecords,
  upsertConsultRecord,
  deleteConsultRecord,
  newConsultRecordTemplate,
  loadStudents,
} from "../lib/storage";
import type { ConsultRecord, Student } from "../lib/types";

export default function ConsultManagement() {
  const [records, setRecords] = useState<ConsultRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "registered" | "prospective">("all");
  const [editingRecord, setEditingRecord] = useState<ConsultRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [recordList, studentList] = await Promise.all([
        loadConsultRecords(true),
        loadStudents(),
      ]);
      setRecords(recordList || []);
      setStudents(studentList || []);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (record: ConsultRecord) => {
    try {
      await upsertConsultRecord(record);
      await loadData();
      setEditingRecord(null);
      alert("상담일지가 저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 상담 기록을 삭제하시겠습니까?")) return;
    try {
      await deleteConsultRecord(id);
      await loadData();
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const filtered = records
    .filter((r) => {
      const searchMatch = r.studentName
        .toLowerCase()
        .includes(search.toLowerCase().trim());
      if (filter === "registered") return searchMatch && !r.isProspective;
      if (filter === "prospective") return searchMatch && r.isProspective;
      return searchMatch;
    })
    .sort((a, b) => b.consultDate.localeCompare(a.consultDate));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-2">학부모 상담일지</h1>
        <p className="text-sm text-muted">
          등록 학생 및 예비 학생 상담 기록을 관리합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs px-3 py-1.5 border transition ${filter === "all" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter("registered")}
            className={`text-xs px-3 py-1.5 border transition ${filter === "registered" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
          >
            등록 학생
          </button>
          <button
            onClick={() => setFilter("prospective")}
            className={`text-xs px-3 py-1.5 border transition ${filter === "prospective" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
          >
            예비 학생
          </button>
        </div>
        <div className="border border-line">
          <div className="flex items-center gap-2 px-4 py-3">
            <Search size={16} className="text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="학생 이름으로 검색"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingRecord(newConsultRecordTemplate())}
            className="px-4 py-2 bg-ink hover:bg-ink/85 text-paper font-semibold inline-flex items-center gap-2 transition text-sm"
          >
            <UserPlus size={16} /> 예비 학생 상담 등록
          </button>
          {students.length > 0 && (
            <select
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                if (student) {
                  setEditingRecord(newConsultRecordTemplate(student.id, student.name));
                  e.target.value = "";
                }
              }}
              className="form-input text-sm py-2"
              defaultValue=""
            >
              <option value="" disabled>
                등록 학생 상담 추가
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 상담 기록 목록 */}
      {filtered.length === 0 ? (
        <div className="border border-line p-8 text-center text-muted text-sm">
          상담 기록이 없습니다.
        </div>
      ) : (
        <div className="border border-line">
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            {filtered.map((record) => (
              <div
                key={record.id}
                className="p-4 border-b border-line last:border-b-0 hover:bg-line-soft transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-ink">
                        {record.studentName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 ${
                          record.isProspective
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {record.isProspective ? "예비학생" : "등록학생"}
                      </span>
                      <span className="text-xs text-muted">
                        {record.consultDate}
                      </span>
                    </div>
                    {(record.parentName || record.parentPhone) && (
                      <div className="flex items-center gap-3 text-xs text-muted mb-2">
                        {record.parentName && <span>학부모: {record.parentName}</span>}
                        {record.parentPhone && <span>연락처: {record.parentPhone}</span>}
                      </div>
                    )}
                    <div className="text-sm text-ink-soft whitespace-pre-line">
                      {record.content.length > 100
                        ? record.content.substring(0, 100) + "..."
                        : record.content}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingRecord({ ...record })}
                      className="text-xs px-2 py-1 border border-line text-ink-soft hover:border-ink hover:text-ink transition"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-xs px-2 py-1 border border-line text-muted hover:border-point hover:text-point transition"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수정/등록 모달 */}
      {editingRecord && (
        <ConsultEditModal
          record={editingRecord}
          students={students}
          onClose={() => setEditingRecord(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ConsultEditModal({
  record,
  students,
  onClose,
  onSave,
}: {
  record: ConsultRecord;
  students: Student[];
  onClose: () => void;
  onSave: (r: ConsultRecord) => Promise<void>;
}) {
  const [form, setForm] = useState<ConsultRecord>(record);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ConsultRecord>(
    key: K,
    value: ConsultRecord[K],
  ) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim()) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    if (!form.content.trim()) {
      alert("상담 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-2xl w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-ink" />
            <h3 className="text-lg font-semibold text-ink">학부모 상담 기록</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-line-soft"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              학생 구분
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={!form.isProspective}
                  onChange={() => update("isProspective", false)}
                  className="w-4 h-4"
                />
                <span className="text-sm">등록 학생</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.isProspective}
                  onChange={() => update("isProspective", true)}
                  className="w-4 h-4"
                />
                <span className="text-sm">예비 학생</span>
              </label>
            </div>
          </div>

          {!form.isProspective && students.length > 0 && (
            <div>
              <label className="block text-xs text-ink-soft mb-1.5">
                등록 학생 선택
              </label>
              <select
                value={form.studentId || ""}
                onChange={(e) => {
                  const student = students.find((s) => s.id === e.target.value);
                  if (student) {
                    update("studentId", student.id);
                    update("studentName", student.name);
                    update("parentName", student.parentName);
                    update("parentPhone", student.parentPhone);
                  }
                }}
                className="form-input"
              >
                <option value="">학생을 선택하세요</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.isProspective && (
            <div>
              <label className="block text-xs text-ink-soft mb-1.5">
                학생 이름
              </label>
              <input
                type="text"
                value={form.studentName}
                onChange={(e) => update("studentName", e.target.value)}
                className="form-input"
                placeholder="예비 학생 이름"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-soft mb-1.5">
                학부모 이름
              </label>
              <input
                type="text"
                value={form.parentName || ""}
                onChange={(e) => update("parentName", e.target.value)}
                className="form-input"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1.5">
                학부모 연락처
              </label>
              <input
                type="tel"
                value={form.parentPhone || ""}
                onChange={(e) => update("parentPhone", e.target.value)}
                className="form-input"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              상담 날짜
            </label>
            <input
              type="date"
              value={form.consultDate}
              onChange={(e) => update("consultDate", e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              상담 내용
            </label>
            <textarea
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              rows={8}
              className="form-input"
              placeholder="상담 내용을 상세히 기록하세요."
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-ink hover:bg-ink/85 text-paper font-semibold inline-flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
