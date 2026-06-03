"use client";

import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Edit3,
  Lock,
  Search,
  X,
  Image as ImageIcon,
  Eye,
  Calendar,
} from "lucide-react";
import {
  loadStudents,
  findStudent,
  upsertStudent,
  deleteStudent,
  upsertExam,
  deleteExam,
  newStudentTemplate,
  newExamTemplate,
  getStudentExams,
  compressImageDataURL,
  uploadImageToStorage,
} from "../../lib/storage";
import {
  CURRENT_GRADES,
  TARGET_GRADES,
  type Student,
  type Exam,
  type CurrentGrade,
  type TargetGrade,
} from "../../lib/types";
import StarRating from "../../components/StarRating";

const ADMIN_PASSWORD = "66009873";

// ─────────────────────────────────────────────
// 학년 계산 유틸
// 기준: 매년 3월 1일 기준 학년 갱신
// 2026년: 2019년생 = 초1, 2014년생 = 초6
// ─────────────────────────────────────────────
function getSchoolGrade(birthDate: string): { label: string; order: number } {
  if (!birthDate) return { label: "알 수 없음", order: 99 };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1~12

  // 학년 기준: 3월 1일 이후면 새 학년
  const schoolYear = month >= 3 ? year : year - 1;

  const birthYear = parseInt(birthDate.slice(0, 4), 10);
  if (isNaN(birthYear)) return { label: "알 수 없음", order: 99 };

  // 입학 연도 = 만 8세가 되는 해 (생년 + 8 - 1 = 생년 + 7)
  // 초1 입학 기준: schoolYear - birthYear - 1 === 6 → 만 6세에 입학 (한국 기준: 생년+8년에 초1)
  // 한국 기준: 생년 + 8 = 초1 입학 연도
  const grade = schoolYear - birthYear - 6; // 한국 기준: 생년+7=초1입학연도 (2019+7=2026 → 초1)

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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeFilterType>("전체");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

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
        setDataLoading(true);
        const startTime = performance.now();
        console.log("🔍 [Admin Page] Loading students...");

        const list = await loadStudents();
        setStudents(list || []);
        setDataLoading(false);

        const elapsed = performance.now() - startTime;
        console.log(
          `✅ [Admin Page] Students loaded - ${elapsed.toFixed(2)}ms`,
        );
      })();
    }
  }, [authed]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
      sessionStorage.setItem("baekho-admin-auth", "true");
    } else {
      setPwError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    sessionStorage.removeItem("baekho-admin-auth");
  };

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

  const handleSaveStudent = async (s: Student) => {
    const prevStudents = [...students];
    const idx = students.findIndex((st) => st.id === s.id);
    const optimisticList =
      idx >= 0
        ? students.map((st) => (st.id === s.id ? s : st))
        : [...students, s];

    setStudents(optimisticList);
    setEditingStudent(null);
    if (selectedStudent?.id === s.id) {
      setSelectedStudent(s);
    }

    try {
      const updatedList = await upsertStudent(s);
      if (Array.isArray(updatedList)) {
        setStudents(updatedList);
      }
    } catch (error) {
      console.error("❌ Save student error:", error);
      setStudents(prevStudents);
      alert("학생 저장에 실패했습니다: " + String(error));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 모든 심사 기록도 함께 삭제됩니다."))
      return;

    const prevStudents = [...students];
    const optimisticList = students.filter((s) => s.id !== id);

    setStudents(optimisticList);
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }

    try {
      const updatedList = await deleteStudent(id);
      if (Array.isArray(updatedList)) {
        setStudents(updatedList);
      }
    } catch (error) {
      console.error("❌ Delete student error:", error);
      setStudents(prevStudents);
      alert("학생 삭제에 실패했습니다: " + String(error));
    }
  };

  const handleSaveExam = async (e: Exam) => {
    setEditingExam(null);
    if (selectedStudent) {
      setSelectedStudent({ ...selectedStudent });
    }
    try {
      await upsertExam(e);
    } catch (error) {
      console.error("❌ Save exam error:", error);
      alert("심사 저장에 실패했습니다: " + String(error));
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent });
      }
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("이 심사 기록을 삭제하시겠습니까?")) return;

    setEditingExam(null);
    if (selectedStudent) {
      setSelectedStudent({ ...selectedStudent });
    }
    try {
      await deleteExam(id);
    } catch (error) {
      console.error("❌ Delete exam error:", error);
      alert("심사 삭제에 실패했습니다: " + String(error));
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent });
      }
    }
  };

  // ─────────────────────────────────────────────
  // 로딩 중
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-4">
        <div className="text-muted">로딩 중...</div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // 비밀번호 화면
  // ─────────────────────────────────────────────
  if (!authed) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-4">
        <div className="border border-line p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={18} className="text-ink-soft" strokeWidth={1.5} />
            <h1 className="text-lg font-semibold text-ink">관리자 로그인</h1>
          </div>
          <p className="text-sm text-muted mb-6">
            한국체대 백호태권도 관리자 전용 페이지입니다.
          </p>
          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="관리자 비밀번호"
              className="form-input"
            />
            {pwError && (
              <div className="text-xs text-point border border-point/40 px-3 py-2.5">
                {pwError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-ink hover:bg-ink/85 text-paper font-semibold py-3 transition"
            >
              입장
            </button>
            <a
              href="/"
              className="text-center text-xs text-muted hover:text-ink inline-flex items-center justify-center gap-1 w-full"
            >
              <ArrowLeft size={12} /> 메인으로
            </a>
          </form>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // 관리자 메인
  // ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">ADMIN</div>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink mt-0.5">
              학생 관리
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 border border-line text-muted hover:border-ink hover:text-ink transition"
            >
              로그아웃
            </button>
            <a
              href="/"
              className="text-sm text-ink-soft hover:text-ink inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> 메인으로
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-10">
        {dataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-1">
              <div className="border border-line mb-4 bg-white">
                <div className="px-4 py-3 border-b border-line">
                  <div className="h-5 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded"></div>
                </div>
                <div className="p-4 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded w-3/4"></div>
                        <div className="h-3 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full h-11 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="border border-line p-6 bg-white space-y-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded w-1/3"></div>
                  <div className="h-4 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded"></div>
                  <div className="h-4 bg-gradient-to-r from-line-soft via-line to-line-soft bg-[length:200%_100%] animate-shimmer rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 text-center">
              <p className="text-xs text-muted animate-pulse">
                학생 데이터를 불러오는 중...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 좌측: 학생 리스트 */}
            <div className="lg:col-span-1">
              {/* 학년 필터 */}
              <div className="flex flex-wrap gap-1 mb-2">
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
              <div className="border border-line mb-4">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
                  <Search size={16} className="text-muted" strokeWidth={1.5} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름으로 검색"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
                  />
                </div>
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted text-sm">
                      {students.length === 0
                        ? "아직 등록된 학생이 없습니다. 새 학생을 추가해주세요."
                        : "검색 결과가 없습니다."}
                    </div>
                  ) : (
                    filtered.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`w-full p-4 border-b border-line last:border-b-0 text-left hover:bg-line-soft transition ${
                          selectedStudent?.id === s.id ? "bg-line-soft" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-line overflow-hidden flex items-center justify-center shrink-0">
                            {s.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.photoUrl}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={16}
                                strokeWidth={1.5}
                                className="text-line"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-ink text-sm">
                              {s.name}
                            </div>
                            <div className="text-xs text-muted">
                              {s.birthDate}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(newStudentTemplate())}
                className="w-full bg-ink hover:bg-ink/85 text-paper font-semibold py-3 inline-flex items-center justify-center gap-2 transition"
              >
                <Plus size={16} /> 새 학생 추가
              </button>
            </div>

            {/* 우측: 학생 상세 & 심사 이력 */}
            <div className="lg:col-span-2">
              {selectedStudent ? (
                <StudentDetail
                  student={selectedStudent}
                  onEditStudent={() =>
                    setEditingStudent({ ...selectedStudent })
                  }
                  onDeleteStudent={handleDeleteStudent}
                  onAddExam={() =>
                    setEditingExam(newExamTemplate(selectedStudent.id))
                  }
                  onEditExam={(exam) => setEditingExam({ ...exam })}
                  onDeleteExam={handleDeleteExam}
                />
              ) : (
                <div className="border border-line p-10 text-center text-muted">
                  좌측에서 학생을 선택하세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleSaveStudent}
        />
      )}

      {editingExam && (
        <ExamEditModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSave={handleSaveExam}
          onDelete={() => handleDeleteExam(editingExam.id)}
        />
      )}
    </main>
  );
}

// ─────────────────────────────────────────────
// 학생 상세 & 심사 이력
// ─────────────────────────────────────────────
function StudentDetail({
  student,
  onEditStudent,
  onDeleteStudent,
  onAddExam,
  onEditExam,
  onDeleteExam,
}: {
  student: Student;
  onEditStudent: () => void;
  onDeleteStudent: (id: string) => Promise<void>;
  onAddExam: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => Promise<void>;
}) {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    (async () => {
      const examList = await getStudentExams(student.id);
      setExams(examList || []);
    })();
  }, [student.id, student]);

  return (
    <div className="space-y-4">
      <div className="border border-line p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">학생 기본 정보</h2>
          <div className="flex gap-2">
            <button
              onClick={onEditStudent}
              className="text-xs px-3 py-1.5 border border-line text-ink-soft hover:border-ink hover:text-ink inline-flex items-center gap-1 transition"
            >
              <Edit3 size={12} /> 수정
            </button>
            <button
              onClick={() => onDeleteStudent(student.id)}
              className="text-xs px-3 py-1.5 border border-line text-muted hover:border-point hover:text-point inline-flex items-center gap-1 transition"
            >
              <Trash2 size={12} /> 삭제
            </button>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="w-20 h-20 border border-line overflow-hidden flex items-center justify-center shrink-0">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={24} strokeWidth={1.5} className="text-line" />
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted">이름:</span>{" "}
              <span className="text-ink font-medium">{student.name}</span>
            </div>
            <div>
              <span className="text-muted">생년월일:</span>{" "}
              <span className="text-ink">{student.birthDate}</span>
            </div>
            <div>
              <span className="text-muted">학년:</span>{" "}
              <span className="text-ink">
                {getSchoolGrade(student.birthDate).label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted">구분:</span>{" "}
              {student.hasBlackBelt && (
                <span className="text-[11px] px-1.5 py-0.5 bg-ink text-paper">
                  유품자
                </span>
              )}
              {student.isColorBelt && (
                <span className="text-[11px] px-1.5 py-0.5 border border-line text-ink-soft">
                  유급자
                </span>
              )}
              {!student.hasBlackBelt && !student.isColorBelt && (
                <span className="text-xs text-muted">미설정</span>
              )}
            </div>
            {student.googleLink && (
              <div className="col-span-2">
                <span className="text-muted">리포트:</span>{" "}
                <a
                  href={student.googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-point underline text-xs"
                >
                  링크 보기
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-line">
          <a
            href={`/student/${student.id}`}
            target="_blank"
            className="text-xs px-4 py-2 border border-line text-ink-soft hover:border-ink hover:text-ink inline-flex items-center gap-1 transition"
          >
            <Eye size={12} /> 학생 페이지 미리보기
          </a>
        </div>
      </div>

      <div className="border border-line">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">심사 이력</h2>
          <button
            onClick={onAddExam}
            className="text-xs px-3 py-1.5 bg-ink hover:bg-ink/85 text-paper font-semibold inline-flex items-center gap-1 transition"
          >
            <Plus size={12} /> 새 심사 등록
          </button>
        </div>
        <div className="max-h-[calc(100vh-450px)] overflow-y-auto">
          {exams.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">
              등록된 심사 기록이 없습니다.
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 border-b border-line last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-muted" />
                      <span className="text-sm font-medium text-ink">
                        {exam.examDate.slice(0, 7).replace("-", "년 ") + "월"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 ${exam.passed ? "border border-point text-point" : "border border-line text-muted"}`}
                      >
                        {exam.passed ? "합격" : "재심사"}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {exam.currentGrade} → {exam.targetGrade}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditExam(exam)}
                      className="text-xs px-2 py-1 border border-line text-ink-soft hover:border-ink hover:text-ink transition"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={() => onDeleteExam(exam.id)}
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

// ─────────────────────────────────────────────
// 학생 편집 모달
// ─────────────────────────────────────────────
function StudentEditModal({
  student,
  onClose,
  onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (s: Student) => Promise<void>;
}) {
  const [form, setForm] = useState<Student>(student);
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof Student>(key: K, value: Student[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImageDataURL(file, 800, 0.82);
      const publicUrl = await uploadImageToStorage(compressed, form.id);
      update("photoUrl", publicUrl);
      alert("사진이 업로드되었습니다!");
    } catch (err) {
      console.error("[handlePhotoUpload]", err);
      alert("사진 업로드 중 오류가 발생했습니다: " + String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.birthDate) {
      alert("이름과 생년월일은 필수 항목입니다.");
      return;
    }
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-2xl w-full p-6 sm:p-8 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-ink">학생 기본 정보</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="학생 이름">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="form-input"
                placeholder="홍길동"
              />
            </Field>
            <Field label="생년월일 (YYYY-MM-DD)">
              <input
                type="text"
                inputMode="numeric"
                value={form.birthDate}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const digitsOnly = inputValue.replace(/\D/g, "").slice(0, 8);
                  if (digitsOnly.length === 8) {
                    update(
                      "birthDate",
                      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`,
                    );
                  } else if (
                    inputValue.includes("-") &&
                    /^\d{4}-\d{2}-\d{2}$/.test(inputValue)
                  ) {
                    update("birthDate", inputValue);
                  } else {
                    update("birthDate", inputValue);
                  }
                }}
                onBlur={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  if (digitsOnly.length === 8) {
                    update(
                      "birthDate",
                      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`,
                    );
                  }
                }}
                className="form-input"
                placeholder="2015-04-12 또는 20150412"
              />
              <p className="text-xs text-muted mt-1.5">
                하이픈 제거된 8자리 숫자가 기본 비밀번호로 사용됩니다
              </p>
            </Field>
          </div>

          <Field label="학생 사진">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border border-line overflow-hidden flex items-center justify-center">
                {form.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon
                    size={20}
                    strokeWidth={1.5}
                    className="text-line"
                  />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && (
                <span className="text-xs text-muted">업로드 중...</span>
              )}
              {form.photoUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => update("photoUrl", "")}
                  className="text-xs text-point underline"
                >
                  사진 제거
                </button>
              )}
            </div>
            <p className="text-xs text-muted mt-1.5">
              사진은 Firebase Storage에 저장되며 public URL로 관리됩니다
            </p>
          </Field>

          <Field label="구글 리포트 링크 (선택)">
            <input
              type="url"
              value={form.googleLink || ""}
              onChange={(e) => update("googleLink", e.target.value)}
              className="form-input"
              placeholder="https://drive.google.com/..."
            />
          </Field>

          <div className="pt-3 border-t border-line space-y-2">
            <p className="text-xs font-semibold text-ink-soft mb-2">
              구분 (admin 전용)
            </p>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasBlackBelt || false}
                  onChange={(e) => update("hasBlackBelt", e.target.checked)}
                  className="w-4 h-4 accent-[#FF0044]"
                />
                <span className="text-sm text-ink-soft">유품자</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isColorBelt || false}
                  onChange={(e) => update("isColorBelt", e.target.checked)}
                  className="w-4 h-4 accent-[#FF0044]"
                />
                <span className="text-sm text-ink-soft">유급자</span>
              </label>
            </div>
          </div>
          <div className="pt-3 border-t border-line">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEnglishName || false}
                onChange={(e) => update("isEnglishName", e.target.checked)}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">
                영어 이름 (체크 시 성을 제거하지 않고 풀네임에 '의'를 붙입니다)
              </span>
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

// ─────────────────────────────────────────────
// 심사 편집 모달
// ─────────────────────────────────────────────
function ExamEditModal({
  exam,
  onClose,
  onSave,
  onDelete,
}: {
  exam: Exam;
  onClose: () => void;
  onSave: (e: Exam) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<Exam>(exam);

  const update = <K extends keyof Exam>(key: K, value: Exam[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center p-4 overflow-y-auto pt-20">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line max-w-4xl w-full p-6 sm:p-8 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-ink">심사 정보 입력</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-line-soft"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <Section title="기본 정보">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="심사 월 (YYYY-MM)">
              <input
                type="month"
                value={form.examDate.slice(0, 7)}
                onChange={(e) => update("examDate", `${e.target.value}-01`)}
                className="form-input"
              />
              <p className="text-xs text-muted mt-1.5">
                월 단위로만 선택됩니다
              </p>
            </Field>
            <Field label="현재 급수">
              <select
                value={form.currentGrade}
                onChange={(e) =>
                  update("currentGrade", e.target.value as CurrentGrade)
                }
                className="form-input"
              >
                {CURRENT_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="응심 급수">
              <select
                value={form.targetGrade}
                onChange={(e) =>
                  update("targetGrade", e.target.value as TargetGrade)
                }
                className="form-input"
              >
                {TARGET_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.passed}
                onChange={(e) => update("passed", e.target.checked)}
                className="w-4 h-4 accent-[#FF0044]"
              />
              <span className="text-sm text-ink-soft">
                합격 처리 (체크 해제 시 재심사)
              </span>
            </label>
          </div>
        </Section>

        <Section title="기본 수련 영역 (별점 1~5)">
          <div className="space-y-3">
            <StarRating
              label="기본기"
              value={form.basicSkills.basics}
              onChange={(v) =>
                update("basicSkills", { ...form.basicSkills, basics: v })
              }
            />
            <StarRating
              label="품새"
              value={form.basicSkills.poomsae}
              onChange={(v) =>
                update("basicSkills", { ...form.basicSkills, poomsae: v })
              }
            />
            <StarRating
              label="겨루기(연결발차기)"
              value={form.basicSkills.sparring}
              onChange={(v) =>
                update("basicSkills", { ...form.basicSkills, sparring: v })
              }
            />
            <StarRating
              label="기술발차기(격파)"
              value={form.basicSkills.breaking}
              onChange={(v) =>
                update("basicSkills", { ...form.basicSkills, breaking: v })
              }
            />
          </div>
        </Section>

        <Section title="태도 인성 영역 (별점 1~5)">
          <div className="space-y-3">
            <StarRating
              label="집중력"
              value={form.attitude.concentration}
              onChange={(v) =>
                update("attitude", { ...form.attitude, concentration: v })
              }
            />
            <StarRating
              label="도전정신"
              value={form.attitude.challenge}
              onChange={(v) =>
                update("attitude", { ...form.attitude, challenge: v })
              }
            />
            <StarRating
              label="인사성"
              value={form.attitude.greeting}
              onChange={(v) =>
                update("attitude", { ...form.attitude, greeting: v })
              }
            />
            <StarRating
              label="자신감"
              value={form.attitude.confidence}
              onChange={(v) =>
                update("attitude", { ...form.attitude, confidence: v })
              }
            />
          </div>
        </Section>

        <Section title="생활 습관 영역 (별점 1~5)">
          <div className="space-y-3">
            <StarRating
              label="복장상태"
              value={form.lifeHabits.uniform}
              onChange={(v) =>
                update("lifeHabits", { ...form.lifeHabits, uniform: v })
              }
            />
            <StarRating
              label="바른 언어 사용"
              value={form.lifeHabits.language}
              onChange={(v) =>
                update("lifeHabits", { ...form.lifeHabits, language: v })
              }
            />
            <StarRating
              label="정리 정돈"
              value={form.lifeHabits.organization}
              onChange={(v) =>
                update("lifeHabits", { ...form.lifeHabits, organization: v })
              }
            />
            <StarRating
              label="규칙 준수"
              value={form.lifeHabits.rules}
              onChange={(v) =>
                update("lifeHabits", { ...form.lifeHabits, rules: v })
              }
            />
          </div>
        </Section>

        <Section title="관장님 한줄 코멘트">
          <textarea
            value={form.comment}
            onChange={(e) => update("comment", e.target.value)}
            rows={4}
            className="form-input leading-loose"
            placeholder="학생에게 전하고 싶은 메시지를 적어 주세요."
          />
        </Section>

        <div className="flex flex-col sm:flex-row gap-2 justify-between mt-6">
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2.5 border border-line text-point hover:bg-point hover:text-white transition"
          >
            심사 기록 삭제
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
    <div className="border-t border-line first:border-t-0 pt-5 first:pt-0 mt-5 first:mt-0">
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  );
}
