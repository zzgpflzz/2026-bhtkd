"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Edit3, X, Search } from "lucide-react";
import {
  loadVehicleSchedules,
  upsertVehicleSchedule,
  deleteVehicleSchedule,
  loadStudentVehicles,
  upsertStudentVehicle,
  deleteStudentVehicle,
  getVehiclesByScheduleId,
  getVehicleStatus,
  newVehicleScheduleTemplate,
  newStudentVehicleTemplate,
  loadStudents,
} from "../../../lib/storage";
import type {
  VehicleSchedule,
  StudentVehicleInfo,
  Student,
} from "../../../lib/types";

export default function VehicleAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState<VehicleSchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<VehicleSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<VehicleSchedule | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<StudentVehicleInfo | null>(null);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("baekho-admin-auth");
    if (savedAuth === "true") {
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      (async () => {
        const [scheduleList, studentList] = await Promise.all([
          loadVehicleSchedules(),
          loadStudents(),
        ]);
        setSchedules(scheduleList || []);
        setStudents(studentList || []);
      })();
    }
  }, [authed]);

  const handleSaveSchedule = async (s: VehicleSchedule) => {
    try {
      await upsertVehicleSchedule(s);
      const updated = await loadVehicleSchedules(true);
      setSchedules(updated);
      setEditingSchedule(null);
      if (selectedSchedule?.id === s.id) {
        setSelectedSchedule(s);
      }
    } catch (error) {
      console.error(error);
      alert("차량 게시물 저장에 실패했습니다: " + String(error));
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 해당 게시물의 모든 원생 차량 정보도 함께 삭제됩니다."))
      return;

    try {
      await deleteVehicleSchedule(id);
      const updated = await loadVehicleSchedules(true);
      setSchedules(updated);
      if (selectedSchedule?.id === id) {
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error(error);
      alert("차량 게시물 삭제에 실패했습니다: " + String(error));
    }
  };

  const handleSaveVehicle = async (v: StudentVehicleInfo) => {
    try {
      await upsertStudentVehicle(v);
      setEditingVehicle(null);
      if (selectedSchedule) {
        setSelectedSchedule({ ...selectedSchedule });
      }
    } catch (error) {
      console.error(error);
      alert("차량 정보 저장에 실패했습니다: " + String(error));
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("이 차량 정보를 삭제하시겠습니까?")) return;

    try {
      await deleteStudentVehicle(id);
      if (selectedSchedule) {
        setSelectedSchedule({ ...selectedSchedule });
      }
    } catch (error) {
      console.error(error);
      alert("차량 정보 삭제에 실패했습니다: " + String(error));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-4">
        <div className="text-muted">로딩 중...</div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-4">
        <div className="border border-line p-8 text-center">
          <p className="text-ink-soft mb-4">관리자 권한이 필요합니다.</p>
          <a
            href="/admin"
            className="text-sm text-point underline"
          >
            관리자 로그인
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">ADMIN</div>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink mt-0.5">
              차량 관리
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="text-sm text-ink-soft hover:text-ink inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> 학생 관리로
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="border border-line mb-4">
              <div className="px-4 py-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">차량 게시물 목록</h2>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {schedules.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">
                    등록된 차량 게시물이 없습니다.
                  </div>
                ) : (
                  schedules
                    .sort((a, b) => b.startDate.localeCompare(a.startDate))
                    .map((s) => {
                      const status = getVehicleStatus(s.startDate, s.endDate);
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSchedule(s)}
                          className={`w-full flex items-start gap-2 p-4 border-b border-line last:border-b-0 hover:bg-line-soft transition text-left ${
                            selectedSchedule?.id === s.id ? "bg-line-soft" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-ink text-sm">
                              {s.title}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              {s.startDate} ~ {s.endDate}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 ${
                                  status === "active"
                                    ? "bg-point text-white"
                                    : status === "upcoming"
                                      ? "border border-ink text-ink"
                                      : "border border-line text-muted"
                                }`}
                              >
                                {status === "active"
                                  ? "운행 중"
                                  : status === "upcoming"
                                    ? "예정"
                                    : "운행 종료"}
                              </span>
                              {!s.isPublished && (
                                <span className="text-[10px] px-2 py-0.5 bg-muted text-paper">
                                  비공개
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            <button
              onClick={() => setEditingSchedule(newVehicleScheduleTemplate())}
              className="w-full bg-ink hover:bg-ink/85 text-paper font-semibold py-3 inline-flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} /> 새 게시물 추가
            </button>
          </div>

          <div className="lg:col-span-2">
            {selectedSchedule ? (
              <ScheduleDetail
                schedule={selectedSchedule}
                students={students}
                onEditSchedule={() =>
                  setEditingSchedule({ ...selectedSchedule })
                }
                onDeleteSchedule={handleDeleteSchedule}
                onAddVehicle={(student) => {
                  setEditingVehicle(
                    newStudentVehicleTemplate(
                      selectedSchedule.id,
                      student.id,
                      student.name,
                      student.birthDate,
                    )
                  );
                }}
                onEditVehicle={(v) => setEditingVehicle({ ...v })}
                onDeleteVehicle={handleDeleteVehicle}
              />
            ) : (
              <div className="border border-line p-10 text-center text-muted">
                좌측에서 차량 게시물을 선택하세요.
              </div>
            )}
          </div>
        </div>
      </div>

      {editingSchedule && (
        <ScheduleEditModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSave={handleSaveSchedule}
        />
      )}

      {editingVehicle && (
        <VehicleEditModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={handleSaveVehicle}
          onDelete={() => handleDeleteVehicle(editingVehicle.id)}
        />
      )}
    </main>
  );
}

function ScheduleDetail({
  schedule,
  students,
  onEditSchedule,
  onDeleteSchedule,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: {
  schedule: VehicleSchedule;
  students: Student[];
  onEditSchedule: () => void;
  onDeleteSchedule: (id: string) => Promise<void>;
  onAddVehicle: (student: Student) => void;
  onEditVehicle: (v: StudentVehicleInfo) => void;
  onDeleteVehicle: (id: string) => Promise<void>;
}) {
  const [vehicles, setVehicles] = useState<StudentVehicleInfo[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const list = await getVehiclesByScheduleId(schedule.id);
      setVehicles(list || []);
    })();
  }, [schedule.id, schedule]);

  const availableStudents = students.filter(
    (s) => !vehicles.some((v) => v.studentId === s.id)
  );

  const filteredVehicles = vehicles.filter((v) =>
    v.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="border border-line p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">게시물 정보</h2>
          <div className="flex gap-2">
            <button
              onClick={onEditSchedule}
              className="text-xs px-3 py-1.5 border border-line text-ink-soft hover:border-ink hover:text-ink inline-flex items-center gap-1 transition"
            >
              <Edit3 size={12} /> 수정
            </button>
            <button
              onClick={() => onDeleteSchedule(schedule.id)}
              className="text-xs px-3 py-1.5 border border-line text-muted hover:border-point hover:text-point inline-flex items-center gap-1 transition"
            >
              <Trash2 size={12} /> 삭제
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted">제목:</span>{" "}
            <span className="text-ink font-medium">{schedule.title}</span>
          </div>
          <div>
            <span className="text-muted">운행 기간:</span>{" "}
            <span className="text-ink">
              {schedule.startDate} ~ {schedule.endDate}
            </span>
          </div>
          <div>
            <span className="text-muted">공개 여부:</span>{" "}
            <span className="text-ink">
              {schedule.isPublished ? "공개" : "비공개"}
            </span>
          </div>
          {schedule.notice && (
            <div>
              <span className="text-muted">안내사항:</span>
              <p className="text-ink-soft mt-1 whitespace-pre-line">
                {schedule.notice}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-line">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            원생 차량 정보 ({vehicles.length}명)
          </h2>
        </div>

        {availableStudents.length > 0 && (
          <div className="p-4 border-b border-line bg-line-soft">
            <div className="text-xs font-medium text-muted mb-2">
              원생 추가 (등록되지 않은 원생 {availableStudents.length}명)
            </div>
            <select
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                if (student) {
                  onAddVehicle(student);
                  e.target.value = "";
                }
              }}
              className="form-input text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                원생을 선택하세요
              </option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.birthDate})
                </option>
              ))}
            </select>
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="p-4 border-b border-line">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-muted" strokeWidth={1.5} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름으로 검색"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
              />
            </div>
          </div>
        )}

        <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">
              {vehicles.length === 0
                ? "등록된 원생이 없습니다. 위에서 원생을 추가해주세요."
                : "검색 결과가 없습니다."}
            </div>
          ) : (
            filteredVehicles.map((v) => (
              <div
                key={v.id}
                className="p-4 border-b border-line last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-ink">
                      {v.studentName}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {v.birthDate}
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {v.pickupEnabled && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#00BC7D1A', color: '#00BC7D' }}>
                            등원
                          </span>
                          <span className="text-ink-soft">
                            {v.pickupLocation} {v.pickupTime}
                          </span>
                        </div>
                      )}
                      {v.dropoffEnabled && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#FF9D001A', color: '#FF9D00' }}>
                            하원
                          </span>
                          <span className="text-ink-soft">
                            {v.dropoffLocation} {v.dropoffTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditVehicle(v)}
                      className="text-xs px-2 py-1 border border-line text-ink-soft hover:border-ink hover:text-ink transition"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={() => onDeleteVehicle(v.id)}
                      className="text-xs px-2 py-1 border border-line text-muted hover:border-point hover:text-point transition"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleEditModal({
  schedule,
  onClose,
  onSave,
}: {
  schedule: VehicleSchedule;
  onClose: () => void;
  onSave: (s: VehicleSchedule) => Promise<void>;
}) {
  const [form, setForm] = useState<VehicleSchedule>(schedule);

  const update = <K extends keyof VehicleSchedule>(
    key: K,
    value: VehicleSchedule[K]
  ) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    await onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-2xl w-full p-6 sm:p-8 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-ink">차량 게시물 정보</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-line-soft"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="게시물 제목">
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="form-input"
              placeholder="예) 2026년 여름방학 차량"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="운행 시작일">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="운행 종료일">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="안내사항 (선택)">
            <textarea
              value={form.notice || ""}
              onChange={(e) => update("notice", e.target.value)}
              rows={4}
              className="form-input"
              placeholder="예) 차량 도착 5분 전까지 탑승 장소에서 기다려주세요."
            />
          </Field>

          <div className="pt-3 border-t border-line">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => update("isPublished", e.target.checked)}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">공개 (체크 해제 시 비공개)</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-ink hover:bg-ink/85 text-paper font-semibold inline-flex items-center justify-center gap-2 transition"
          >
            <Save size={16} /> 저장하기
          </button>
        </div>
      </form>
    </div>
  );
}

function VehicleEditModal({
  vehicle,
  onClose,
  onSave,
  onDelete,
}: {
  vehicle: StudentVehicleInfo;
  onClose: () => void;
  onSave: (v: StudentVehicleInfo) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<StudentVehicleInfo>(vehicle);

  const update = <K extends keyof StudentVehicleInfo>(
    key: K,
    value: StudentVehicleInfo[K]
  ) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center p-4 overflow-y-auto pt-10">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-3xl w-full p-6 sm:p-8 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-ink">
            {form.studentName}의 차량 정보
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-line-soft"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <Section title="등원 정보">
            <label className="inline-flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.pickupEnabled}
                onChange={(e) => update("pickupEnabled", e.target.checked)}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">등원 차량 이용</span>
            </label>
            {form.pickupEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="등원 장소">
                  <input
                    value={form.pickupLocation || ""}
                    onChange={(e) => update("pickupLocation", e.target.value)}
                    className="form-input"
                    placeholder="예) OO아파트 정문"
                  />
                </Field>
                <Field label="등원 시간">
                  <input
                    type="text"
                    value={form.pickupTime || ""}
                    onChange={(e) => update("pickupTime", e.target.value)}
                    className="form-input"
                    placeholder="예) 오전 9시 10분"
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section title="하원 정보">
            <label className="inline-flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.dropoffEnabled}
                onChange={(e) => update("dropoffEnabled", e.target.checked)}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">하원 차량 이용</span>
            </label>
            {form.dropoffEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="하원 장소">
                  <input
                    value={form.dropoffLocation || ""}
                    onChange={(e) => update("dropoffLocation", e.target.value)}
                    className="form-input"
                    placeholder="예) OO아파트 정문"
                  />
                </Field>
                <Field label="하원 시간">
                  <input
                    type="text"
                    value={form.dropoffTime || ""}
                    onChange={(e) => update("dropoffTime", e.target.value)}
                    className="form-input"
                    placeholder="예) 오후 2시 30분"
                  />
                </Field>
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-between mt-6">
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2.5 border border-line text-point hover:bg-point hover:text-white transition"
          >
            차량 정보 삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-ink hover:bg-ink/85 text-paper font-semibold inline-flex items-center justify-center gap-2 transition"
            >
              <Save size={16} /> 저장하기
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line first:border-t-0 pt-5 first:pt-0">
      <h4 className="text-xs font-semibold text-muted mb-3 tracking-wider uppercase">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="block text-xs text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  );
}
