"use client";

import { useEffect, useState } from "react";
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
} from "../../lib/storage";
import { GRADES, type Student, type Exam, type Grade } from "../../lib/types";
import StarRating from "../../components/StarRating";

const ADMIN_PASSWORD = "66009873";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // 컴포넌트 마운트 시 세션 스토리지에서 인증 상태 확인
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
        console.log("🔍 [Admin Page] Loading students (lightweight mode)...");

        // lightweight=true: 사진 제외, 리스트만 빠르게 로드
        const list = await loadStudents(false, true);
        setStudents(list || []);
        setDataLoading(false);

        const elapsed = performance.now() - startTime;
        console.log(`✅ [Admin Page] Students loaded - ${elapsed.toFixed(2)}ms`);
      })();
    }
  }, [authed]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
      // 세션 스토리지에 인증 상태 저장 (브라우저 탭 닫으면 사라짐)
      sessionStorage.setItem("baekho-admin-auth", "true");
    } else {
      setPwError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    sessionStorage.removeItem("baekho-admin-auth");
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const handleSaveStudent = async (s: Student) => {
    try {
      const updatedList = await upsertStudent(s);

      if (Array.isArray(updatedList)) {
        setStudents(updatedList);
      } else {
        setStudents([]);
      }

      setEditingStudent(null);
      if (selectedStudent?.id === s.id) {
        setSelectedStudent(s);
      }
    } catch (error) {
      console.error("❌ Save student error:", error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 모든 심사 기록도 함께 삭제됩니다.")) return;

    try {
      const updatedList = await deleteStudent(id);

      if (Array.isArray(updatedList)) {
        setStudents(updatedList);
      } else {
        setStudents([]);
      }

      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error("❌ Delete student error:", error);
    }
  };

  const handleSaveExam = async (e: Exam) => {
    try {
      await upsertExam(e);
      setEditingExam(null);

      // 선택된 학생의 심사 기록을 새로고침
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent });
      }
    } catch (error) {
      console.error("❌ Save exam error:", error);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("이 심사 기록을 삭제하시겠습니까?")) return;

    try {
      await deleteExam(id);
      setEditingExam(null);

      // 선택된 학생의 심사 기록을 새로고침
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent });
      }
    } catch (error) {
      console.error("❌ Delete exam error:", error);
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
          // 스켈레톤 로딩 UI
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 좌측 스켈레톤 */}
            <div className="lg:col-span-1">
              <div className="border border-line mb-4">
                <div className="px-4 py-3 border-b border-line">
                  <div className="h-5 bg-line-soft animate-pulse rounded"></div>
                </div>
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-line-soft animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-line-soft animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-line-soft animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full h-11 bg-line-soft animate-pulse"></div>
            </div>
            {/* 우측 스켈레톤 */}
            <div className="lg:col-span-2">
              <div className="border border-line p-6">
                <div className="h-6 bg-line-soft animate-pulse rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-line-soft animate-pulse rounded"></div>
                  <div className="h-4 bg-line-soft animate-pulse rounded w-5/6"></div>
                  <div className="h-4 bg-line-soft animate-pulse rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 좌측: 학생 리스트 */}
            <div className="lg:col-span-1">
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
                            <div className="text-xs text-muted">{s.birthDate}</div>
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
                  onEditStudent={() => setEditingStudent({ ...selectedStudent })}
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

      {/* 학생 편집 모달 */}
      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleSaveStudent}
        />
      )}

      {/* 심사 편집 모달 */}
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
  const [fullStudent, setFullStudent] = useState<Student>(student);

  useEffect(() => {
    (async () => {
      const startTime = performance.now();
      console.log(`🔍 [StudentDetail] Loading full data for ${student.name}...`);

      // 사진 포함한 전체 학생 정보와 심사 기록을 병렬로 로드
      const [studentData, examList] = await Promise.all([
        findStudent(student.id),
        getStudentExams(student.id),
      ]);

      if (studentData) setFullStudent(studentData);
      setExams(examList || []);

      const elapsed = performance.now() - startTime;
      console.log(`✅ [StudentDetail] Full data loaded - ${elapsed.toFixed(2)}ms`);
    })();
  }, [student.id]);

  return (
    <div className="space-y-4">
      {/* 학생 기본 정보 */}
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
            {fullStudent.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullStudent.photoUrl}
                alt={fullStudent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={24} strokeWidth={1.5} className="text-line" />
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted">이름:</span>{" "}
              <span className="text-ink font-medium">{fullStudent.name}</span>
            </div>
            <div>
              <span className="text-muted">생년월일:</span>{" "}
              <span className="text-ink">{fullStudent.birthDate}</span>
            </div>
            {fullStudent.googleLink && (
              <div className="col-span-2">
                <span className="text-muted">리포트:</span>{" "}
                <a
                  href={fullStudent.googleLink}
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
            href={`/student/${fullStudent.id}`}
            target="_blank"
            className="text-xs px-4 py-2 border border-line text-ink-soft hover:border-ink hover:text-ink inline-flex items-center gap-1 transition"
          >
            <Eye size={12} /> 학생 페이지 미리보기
          </a>
        </div>
      </div>

      {/* 심사 이력 */}
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
                        {exam.examDate}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 ${
                          exam.passed
                            ? "border border-point text-point"
                            : "border border-line text-muted"
                        }`}
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

  const update = <K extends keyof Student>(key: K, value: Student[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // 800px 이내 + jpeg 82% 압축 → Firestore 1MB 한도 안전
      const compressed = await compressImageDataURL(file, 800, 0.82);
      update("photoUrl", compressed);
    } catch (err) {
      console.error("[handlePhotoUpload]", err);
      alert("사진을 불러오는 중 오류가 발생했습니다.");
    } finally {
      // 동일 파일 재선택 가능하도록 input 초기화
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
                  // 하이픈을 제거한 숫자만 추출하여 8자리로 제한
                  const digitsOnly = inputValue.replace(/\D/g, "").slice(0, 8);

                  // 8자리가 되면 YYYY-MM-DD 형식으로 변환하여 저장
                  if (digitsOnly.length === 8) {
                    const formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
                    update("birthDate", formatted);
                  } else if (inputValue.includes('-') && /^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
                    // 이미 YYYY-MM-DD 형식인 경우 그대로 사용
                    update("birthDate", inputValue);
                  } else {
                    // 입력 중인 경우 원본 그대로 저장
                    update("birthDate", inputValue);
                  }
                }}
                onBlur={(e) => {
                  // 포커스를 잃을 때 하이픈 제거 후 재포맷
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  if (digitsOnly.length === 8) {
                    const formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
                    update("birthDate", formatted);
                  }
                }}
                className="form-input"
                placeholder="2015-04-12 또는 20150412"
              />
              <p className="text-xs text-muted mt-1.5">하이픈 제거된 8자리 숫자가 기본 비밀번호로 사용됩니다</p>
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
                className="text-sm"
              />
              {form.photoUrl && (
                <button
                  type="button"
                  onClick={() => update("photoUrl", "")}
                  className="text-xs text-point underline"
                >
                  사진 제거
                </button>
              )}
            </div>
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

        {/* 기본 정보 */}
        <Section title="기본 정보">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="심사 월 (YYYY-MM)">
              <input
                type="month"
                value={form.examDate.slice(0, 7)}
                onChange={(e) => update("examDate", `${e.target.value}-01`)}
                className="form-input"
              />
              <p className="text-xs text-muted mt-1.5">월 단위로만 선택됩니다</p>
            </Field>
            <Field label="현재 급수">
              <select
                value={form.currentGrade}
                onChange={(e) => update("currentGrade", e.target.value as Grade)}
                className="form-input"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="응심 급수">
              <select
                value={form.targetGrade}
                onChange={(e) => update("targetGrade", e.target.value as Grade)}
                className="form-input"
              >
                {GRADES.map((g) => (
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

        {/* 기본 수련 영역 */}
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

        {/* 태도 인성 영역 */}
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

        {/* 생활 습관 영역 */}
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

        {/* 코멘트 */}
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
