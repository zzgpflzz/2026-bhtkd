"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import {
  loadAttendanceStudents,
  upsertAttendanceStudent,
  deleteAttendanceStudent,
  newAttendanceStudentTemplate,
  calculateAge,
  getAgeGroup,
} from "@/lib/storage";
import type { AttendanceStudent, DayOfWeek } from "@/lib/types";

const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토"];

export default function AttendanceStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<AttendanceStudent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await loadAttendanceStudents(true);
      setStudents(data);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingStudent(newAttendanceStudentTemplate());
    setShowModal(true);
  }

  function openEditModal(student: AttendanceStudent) {
    setEditingStudent({ ...student });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStudent(null);
  }

  async function handleSave() {
    if (!editingStudent) return;

    if (!editingStudent.name.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }
    if (!editingStudent.birthDate) {
      alert("생년월일을 입력해 주세요.");
      return;
    }
    if (editingStudent.attendanceDays.length === 0) {
      alert("등원 요일을 최소 1개 이상 선택해 주세요.");
      return;
    }

    try {
      await upsertAttendanceStudent(editingStudent);
      alert("저장되었습니다.");
      await loadData();
      closeModal();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} 원생을 삭제하시겠습니까?\n출석 기록도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteAttendanceStudent(id);
      alert("삭제되었습니다.");
      await loadData();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  }

  function toggleDay(day: DayOfWeek) {
    if (!editingStudent) return;
    const days = editingStudent.attendanceDays;
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    setEditingStudent({ ...editingStudent, attendanceDays: newDays });
  }

  // 나이대별 그룹화
  const groupedStudents = students.reduce(
    (acc, student) => {
      const age = calculateAge(student.birthDate);
      const group = getAgeGroup(age);
      if (!acc[group]) acc[group] = [];
      acc[group].push({ ...student, age });
      return acc;
    },
    {} as Record<string, Array<AttendanceStudent & { age: number }>>,
  );

  const sortedGroups = Object.entries(groupedStudents).sort((a, b) => {
    const order = ["유치부", "초등 저학년", "초등 고학년", "중고등부"];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AttendanceHeader current="students" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">원생 관리</h1>
            <p className="text-sm text-muted">전체 {students.length}명</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-point hover:bg-point-dark text-white px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            <Plus size={16} />
            원생 추가
          </button>
        </div>

        {students.length === 0 ? (
          <div className="border border-line p-8 text-center text-muted">
            등록된 원생이 없습니다. 원생을 추가해 주세요.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(([groupName, groupStudents]) => (
              <div key={groupName}>
                <h2 className="text-lg font-semibold text-ink mb-4">
                  {groupName} ({groupStudents.length}명)
                </h2>
                <div className="space-y-3">
                  {groupStudents
                    .sort((a, b) => a.age - b.age)
                    .map((student) => (
                      <div
                        key={student.id}
                        className="border border-line bg-white p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-ink">
                              {student.name}
                            </span>
                            <span className="text-xs text-muted">
                              {student.age}세
                            </span>
                          </div>
                          <div className="text-sm text-muted">
                            등원 요일: {student.attendanceDays.join(", ")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 text-muted hover:text-ink hover:bg-gray-100 transition"
                            title="수정"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 transition"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      {showModal && editingStudent && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white border border-line max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-ink">
                {editingStudent.createdAt === new Date().toISOString()
                  ? "원생 추가"
                  : "원생 수정"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  placeholder="홍길동"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  생년월일
                </label>
                <input
                  type="date"
                  value={editingStudent.birthDate}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      birthDate: e.target.value,
                    })
                  }
                  className="form-input w-full"
                />
                {editingStudent.birthDate && (
                  <p className="text-xs text-muted mt-2">
                    현재 나이: {calculateAge(editingStudent.birthDate)}세
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  등원 요일 (복수 선택 가능)
                </label>
                <div className="flex gap-2">
                  {DAYS.map((day) => {
                    const isSelected = editingStudent.attendanceDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "bg-point text-white"
                            : "bg-gray-100 text-muted hover:bg-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-point hover:bg-point-dark text-white py-3 font-semibold transition"
              >
                저장
              </button>
              <button
                onClick={closeModal}
                className="px-6 border border-line hover:bg-gray-100 text-ink py-3 font-semibold transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceHeader({ current }: { current: string }) {
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
