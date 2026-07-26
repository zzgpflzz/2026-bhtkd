"use client";

import { useEffect, useState } from "react";
import { Phone, Search, Save, Edit3 } from "lucide-react";
import { loadStudents, upsertStudent } from "../lib/storage";
import type { Student } from "../lib/types";

function getSchoolGrade(birthDate: string): { label: string; order: number } {
  if (!birthDate) return { label: "알 수 없음", order: 99 };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const schoolYear = month >= 3 ? year : year - 1;
  const birthYear = parseInt(birthDate.slice(0, 4), 10);

  if (isNaN(birthYear)) return { label: "알 수 없음", order: 99 };

  const grade = schoolYear - birthYear - 6;

  if (grade < 1) return { label: "유치부", order: 0 };
  if (grade >= 7) return { label: "중등부", order: 7 };
  return { label: `초${grade}`, order: grade };
}

const GRADE_FILTER_OPTIONS = [
  "전체",
  "유치부",
  "초1",
  "초2",
  "초3",
  "초4",
  "초5",
  "초6",
  "중등부",
] as const;
type GradeFilterType = (typeof GRADE_FILTER_OPTIONS)[number];

export default function ParentContact() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeFilterType>("전체");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const list = await loadStudents();
      setStudents(list || []);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = students
    .filter((s) => {
      const nameMatch = s.name
        .toLowerCase()
        .includes(search.toLowerCase().trim());
      const { label } = getSchoolGrade(s.birthDate);
      const gradeMatch = gradeFilter === "전체" || label === gradeFilter;
      return nameMatch && gradeMatch;
    })
    .sort((a, b) => {
      const ga = getSchoolGrade(a.birthDate).order;
      const gb = getSchoolGrade(b.birthDate).order;
      if (ga !== gb) return ga - gb;
      return a.birthDate.localeCompare(b.birthDate);
    });

  const handleSave = async (student: Student) => {
    try {
      await upsertStudent(student);
      await loadData();
      setEditingStudent(null);
      alert("학부모 연락처가 저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

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
        <h1 className="text-2xl font-semibold text-ink mb-2">학부모 연락처</h1>
        <p className="text-sm text-muted">
          학생별 학부모 연락처를 관리합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-1">
          {GRADE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setGradeFilter(opt)}
              className={`text-[11px] px-2 py-1 border transition ${gradeFilter === opt ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="border border-line">
          <div className="flex items-center gap-2 px-4 py-3">
            <Search size={16} className="text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름으로 검색"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      {filtered.length === 0 ? (
        <div className="border border-line p-8 text-center text-muted text-sm">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="border border-line">
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="p-4 border-b border-line last:border-b-0 hover:bg-line-soft transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-ink">
                        {student.name}
                      </span>
                      <span className="text-xs text-muted">
                        {getSchoolGrade(student.birthDate).label}
                      </span>
                      <span className="text-xs text-muted">
                        {student.birthDate}
                      </span>
                    </div>
                    {student.parentName || student.parentPhone ? (
                      <div className="flex items-center gap-3 text-sm">
                        {student.parentName && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted">학부모:</span>
                            <span className="text-ink">{student.parentName}</span>
                          </div>
                        )}
                        {student.parentPhone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-muted" />
                            <span className="text-ink">{student.parentPhone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted">
                        학부모 연락처가 등록되지 않았습니다.
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingStudent({ ...student })}
                    className="text-xs px-3 py-1.5 border border-line text-ink-soft hover:border-ink hover:text-ink inline-flex items-center gap-1 transition"
                  >
                    <Edit3 size={12} /> 수정
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingStudent && (
        <ContactEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ContactEditModal({
  student,
  onClose,
  onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (s: Student) => Promise<void>;
}) {
  const [form, setForm] = useState<Student>(student);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Student>(key: K, value: Student[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      console.error("저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-lg w-full p-6"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-ink">
            {form.name} - 학부모 연락처
          </h3>
          <p className="text-xs text-muted mt-1">
            {getSchoolGrade(form.birthDate).label} · {form.birthDate}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              학부모 이름
            </label>
            <input
              type="text"
              value={form.parentName || ""}
              onChange={(e) => update("parentName", e.target.value)}
              className="form-input"
              placeholder="예) 홍길동"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              학부모 연락처
            </label>
            <input
              type="tel"
              value={form.parentPhone || ""}
              onChange={(e) => {
                // 숫자와 하이픈만 허용
                const cleaned = e.target.value.replace(/[^0-9-]/g, "");
                update("parentPhone", cleaned);
              }}
              className="form-input"
              placeholder="예) 010-1234-5678"
            />
            <p className="text-xs text-muted mt-1.5">
              숫자와 하이픈(-)만 입력 가능합니다.
            </p>
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
