"use client";

import { useEffect, useState } from "react";
import { DollarSign, Plus, Edit3, Trash2, Save, X, Search, CheckCircle, AlertCircle } from "lucide-react";
import {
  loadTuitionPayments,
  upsertTuitionPayment,
  deleteTuitionPayment,
  newTuitionPaymentTemplate,
  loadStudents,
  calculateDelayDays,
} from "../lib/storage";
import type { TuitionPayment, Student } from "../lib/types";

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

export default function TuitionManagement() {
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "delayed">("all");
  const [editingPayment, setEditingPayment] = useState<TuitionPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [paymentList, studentList] = await Promise.all([
        loadTuitionPayments(true),
        loadStudents(),
      ]);
      setPayments(paymentList || []);
      setStudents(studentList || []);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (payment: TuitionPayment) => {
    try {
      await upsertTuitionPayment(payment);
      await loadData();
      setEditingPayment(null);
      alert("교육비 정보가 저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 교육비 기록을 삭제하시겠습니까?")) return;
    try {
      await deleteTuitionPayment(id);
      await loadData();
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleTogglePaid = async (payment: TuitionPayment) => {
    const updated = {
      ...payment,
      isPaid: !payment.isPaid,
      paidDate: !payment.isPaid ? new Date().toISOString().split("T")[0] : undefined,
      updatedAt: new Date().toISOString(),
    };
    try {
      await upsertTuitionPayment(updated);
      await loadData();
    } catch (error) {
      console.error("업데이트 실패:", error);
      alert("업데이트에 실패했습니다.");
    }
  };

  const filtered = payments
    .filter((p) => {
      if (p.month !== monthFilter) return false;

      const searchMatch = p.studentName
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      if (statusFilter === "paid") return searchMatch && p.isPaid;
      if (statusFilter === "unpaid") return searchMatch && !p.isPaid;
      if (statusFilter === "delayed") {
        const delay = calculateDelayDays(p.dueDate, p.isPaid, p.paidDate);
        return searchMatch && delay > 0;
      }
      return searchMatch;
    })
    .sort((a, b) => {
      // 미납 우선, 그 다음 지연일수 순
      const aDelay = calculateDelayDays(a.dueDate, a.isPaid, a.paidDate);
      const bDelay = calculateDelayDays(b.dueDate, b.isPaid, b.paidDate);
      if (!a.isPaid && b.isPaid) return -1;
      if (a.isPaid && !b.isPaid) return 1;
      if (aDelay !== bDelay) return bDelay - aDelay;
      return a.studentName.localeCompare(b.studentName);
    });

  // 통계
  const stats = {
    total: filtered.length,
    paid: filtered.filter((p) => p.isPaid).length,
    unpaid: filtered.filter((p) => !p.isPaid).length,
    delayed: filtered.filter((p) => calculateDelayDays(p.dueDate, p.isPaid, p.paidDate) > 0).length,
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
        <h1 className="text-2xl font-semibold text-ink mb-2">교육비 관리</h1>
        <p className="text-sm text-muted">
          학생별 교육비 납부 현황을 관리합니다.
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="border border-line p-4 bg-white">
          <div className="text-xs text-muted mb-1">총 학생</div>
          <div className="text-2xl font-semibold text-ink">{stats.total}</div>
        </div>
        <div className="border border-line p-4 bg-green-50">
          <div className="text-xs text-green-700 mb-1">납부 완료</div>
          <div className="text-2xl font-semibold text-green-700">{stats.paid}</div>
        </div>
        <div className="border border-line p-4 bg-gray-50">
          <div className="text-xs text-gray-700 mb-1">미납</div>
          <div className="text-2xl font-semibold text-gray-700">{stats.unpaid}</div>
        </div>
        <div className="border border-line p-4 bg-red-50">
          <div className="text-xs text-red-700 mb-1">지연</div>
          <div className="text-2xl font-semibold text-red-700">{stats.delayed}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">대상 월:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="form-input text-sm py-1.5"
          />
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-xs px-3 py-1.5 border transition ${statusFilter === "all" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`text-xs px-3 py-1.5 border transition ${statusFilter === "paid" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
            >
              납부완료
            </button>
            <button
              onClick={() => setStatusFilter("unpaid")}
              className={`text-xs px-3 py-1.5 border transition ${statusFilter === "unpaid" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
            >
              미납
            </button>
            <button
              onClick={() => setStatusFilter("delayed")}
              className={`text-xs px-3 py-1.5 border transition ${statusFilter === "delayed" ? "bg-ink text-paper border-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
            >
              지연
            </button>
          </div>
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
        {students.length > 0 && (
          <select
            onChange={(e) => {
              const student = students.find((s) => s.id === e.target.value);
              if (student) {
                setEditingPayment(newTuitionPaymentTemplate(student.id, student.name));
                e.target.value = "";
              }
            }}
            className="form-input text-sm py-2"
            defaultValue=""
          >
            <option value="" disabled>
              학생 선택하여 교육비 추가
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({getSchoolGrade(s.birthDate).label})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 교육비 목록 */}
      {filtered.length === 0 ? (
        <div className="border border-line p-8 text-center text-muted text-sm">
          {monthFilter}월 교육비 기록이 없습니다.
        </div>
      ) : (
        <div className="border border-line">
          <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
            {filtered.map((payment) => {
              const delayDays = calculateDelayDays(payment.dueDate, payment.isPaid, payment.paidDate);
              return (
                <div
                  key={payment.id}
                  className={`p-4 border-b border-line last:border-b-0 transition ${
                    !payment.isPaid && delayDays > 0
                      ? "bg-red-50"
                      : payment.isPaid
                        ? "bg-green-50/30"
                        : "hover:bg-line-soft"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleTogglePaid(payment)}
                        className="shrink-0"
                      >
                        {payment.isPaid ? (
                          <CheckCircle size={24} className="text-green-600" />
                        ) : (
                          <AlertCircle size={24} className="text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-ink">
                            {payment.studentName}
                          </span>
                          <span className="text-xs text-muted">
                            납부기한: {payment.dueDate}
                          </span>
                          {payment.isPaid && payment.paidDate && (
                            <span className="text-xs text-green-700">
                              납부일: {payment.paidDate}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-ink">
                            {payment.amount.toLocaleString()}원
                          </span>
                          {delayDays > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 font-semibold">
                              D+{delayDays}일 지연
                            </span>
                          )}
                          {payment.isPaid && delayDays === 0 && (
                            <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800">
                              정상 납부
                            </span>
                          )}
                        </div>
                        {payment.note && (
                          <div className="text-xs text-muted mt-1">
                            메모: {payment.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPayment({ ...payment })}
                        className="text-xs px-2 py-1 border border-line text-ink-soft hover:border-ink hover:text-ink transition"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-xs px-2 py-1 border border-line text-muted hover:border-point hover:text-point transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 수정/등록 모달 */}
      {editingPayment && (
        <TuitionEditModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TuitionEditModal({
  payment,
  onClose,
  onSave,
}: {
  payment: TuitionPayment;
  onClose: () => void;
  onSave: (p: TuitionPayment) => Promise<void>;
}) {
  const [form, setForm] = useState<TuitionPayment>(payment);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof TuitionPayment>(
    key: K,
    value: TuitionPayment[K],
  ) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) {
      alert("금액을 입력해주세요.");
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
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-ink" />
            <h3 className="text-lg font-semibold text-ink">
              {form.studentName} - 교육비 정보
            </h3>
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
              대상 월
            </label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => update("month", e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              납부 기한
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              금액 (원)
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => update("amount", parseInt(e.target.value) || 0)}
              className="form-input"
              placeholder="예) 150000"
              min="0"
              step="1000"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) => {
                  update("isPaid", e.target.checked);
                  if (e.target.checked && !form.paidDate) {
                    update("paidDate", new Date().toISOString().split("T")[0]);
                  }
                }}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">납부 완료</span>
            </label>
          </div>

          {form.isPaid && (
            <div>
              <label className="block text-xs text-ink-soft mb-1.5">
                납부 날짜
              </label>
              <input
                type="date"
                value={form.paidDate || ""}
                onChange={(e) => update("paidDate", e.target.value)}
                className="form-input"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-ink-soft mb-1.5">
              메모 (선택)
            </label>
            <textarea
              value={form.note || ""}
              onChange={(e) => update("note", e.target.value)}
              rows={3}
              className="form-input"
              placeholder="특이사항이나 메모를 입력하세요."
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
