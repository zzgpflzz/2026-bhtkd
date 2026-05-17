"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Download, User, X, Star } from "lucide-react";
import StarRating from "../../../components/StarRating";
import Certificate from "../../../components/Certificate";
import { findStudent, getStudentExams } from "../../../lib/storage";
import { RATING_GUIDE } from "../../../lib/types";
import type { Student, Exam } from "../../../lib/types";

// 한국어 조사 처리 함수
function getNameWithJosa(fullName: string, isEnglishName?: boolean): string {
  if (!fullName) return fullName;

  // 영어 이름인 경우 성을 제거하지 않고 풀네임에 '의' 붙임
  if (isEnglishName) {
    return `${fullName}의`;
  }

  // 한국어 이름인 경우 성 제외한 이름만 사용
  const firstName = fullName.length > 1 ? fullName.slice(1) : fullName;
  if (!firstName) return fullName;

  const lastChar = firstName[firstName.length - 1];
  const charCode = lastChar.charCodeAt(0);

  // 한글 범위 확인 (0xAC00 ~ 0xD7A3)
  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    // 받침이 있는지 확인: (charCode - 0xAC00) % 28 !== 0
    const hasFinalConsonant = (charCode - 0xAC00) % 28 !== 0;
    return hasFinalConsonant ? `${firstName}이의` : `${firstName}의`;
  }

  // 한글이 아닌 경우 기본값 (영어 이름이지만 체크박스 안 한 경우)
  return `${firstName}의`;
}

export default function StudentResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const pageStartTime = performance.now();
      console.log(`🔍 [Student Page] Loading data for student ID: ${params.id}`);

      // 단일 학생과 심사 기록을 병렬로 로드
      const [s, examList] = await Promise.all([
        findStudent(params.id),
        getStudentExams(params.id),
      ]);

      setStudent(s);
      setExams(examList || []);

      const totalTime = performance.now() - pageStartTime;
      console.log(`✅ [Student Page] Total page load - ${totalTime.toFixed(2)}ms`);
      console.log(`   Student: ${s?.name || "Not found"}, Exams: ${examList?.length || 0}`);
    })();
  }, [params.id]);

  const handleDownload = async () => {
    if (!certRef.current || !student || !selectedExam) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${student.name}_백호태권도_합격증_${selectedExam.examDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("이미지 저장 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  const scrollToReport = () => {
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!student) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="border border-line p-8 text-center">
          <p className="text-ink-soft">학생 정보를 불러오는 중입니다...</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-muted underline"
          >
            메인으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  const displayName = getNameWithJosa(student.name, student.isEnglishName);

  return (
    <main className="min-h-screen bg-white text-ink">
      {/* 상단 네비 */}
      <header className="border-b border-[#DCDEE0]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm transition"
          >
            <ArrowLeft size={16} /> 메인으로
          </button>
          <div className="text-xs text-muted">한국체대 백호태권도</div>
        </div>
      </header>

      {/* 히어로 섹션 - 2분할 레이아웃 */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 pt-8 sm:pt-10 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* 왼쪽: 사진 */}
          <div className="lg:col-span-5">
            <div className="w-full max-w-[280px] sm:max-w-xs mx-auto lg:mx-0 aspect-[4/5] border border-[#DCDEE0] overflow-hidden flex items-center justify-center bg-white">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} strokeWidth={1} className="text-[#DCDEE0]" />
              )}
            </div>
          </div>

          {/* 오른쪽: 텍스트 정보 */}
          <div className="lg:col-span-7 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink leading-tight break-keep">
              {displayName}<br />성장을 기록합니다
            </h1>

            <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed break-keep">
              안녕하세요 😊<br />
              {displayName} 성장 과정을 기록한<br />
              심사 영상을 확인하실 수 있는 공간입니다.<br />
              {displayName} 변화와 발전 모습을<br />
              지속적으로 업로드하고 있습니다.
            </p>

            {student.googleLink && (
              <a
                href={student.googleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-point hover:bg-point-dark transition text-white font-semibold px-8 py-3.5 text-sm shadow-md"
              >
                영상, 사진 리포트 보기
                <ArrowRight size={16} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 리포트 리스트 (Accordion) */}
      <section
        ref={reportRef}
        className="max-w-5xl mx-auto px-6 lg:px-8 pb-16"
      >
        <h2 className="text-2xl font-semibold text-ink mb-5">월별 성장 리포트</h2>

        {exams.length === 0 ? (
          <div className="border border-[#DCDEE0] p-10 text-center">
            <p className="text-ink-soft text-lg">첫 번째 심사를 기다리고 있습니다</p>
            <p className="text-muted text-sm mt-2">심사 결과가 등록되면 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => {
              const monthLabel = `${exam.examDate.slice(0, 7).split("-")[0]}년 ${exam.examDate.slice(0, 7).split("-")[1]}월 심사`;
              const totalBasicSkills =
                (exam.basicSkills?.basics || 0) +
                (exam.basicSkills?.poomsae || 0) +
                (exam.basicSkills?.sparring || 0) +
                (exam.basicSkills?.breaking || 0);
              const totalAttitude =
                (exam.attitude?.concentration || 0) +
                (exam.attitude?.challenge || 0) +
                (exam.attitude?.greeting || 0) +
                (exam.attitude?.confidence || 0);
              const totalLifeHabits =
                (exam.lifeHabits?.uniform || 0) +
                (exam.lifeHabits?.language || 0) +
                (exam.lifeHabits?.organization || 0) +
                (exam.lifeHabits?.rules || 0);

              return (
                <div key={exam.id} className="border border-[#DCDEE0]">
                  {/* 아코디언 헤더 */}
                  <button
                    onClick={() =>
                      setExpandedExam(expandedExam === exam.id ? null : exam.id)
                    }
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8F9FA] transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-base font-semibold text-ink">
                        {monthLabel}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-1 ${
                          exam.passed
                            ? "border border-point text-point"
                            : "border border-line text-muted"
                        }`}
                      >
                        {exam.passed ? "합격" : "재심사"}
                      </span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-ink-soft transition-transform ${
                        expandedExam === exam.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* 아코디언 콘텐츠 */}
                  {expandedExam === exam.id && (
                    <div className="border-t border-[#DCDEE0] p-5 sm:p-6 space-y-5">
                      {/* 프로필 요약 */}
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        <div className="w-16 h-16 border border-[#DCDEE0] overflow-hidden flex items-center justify-center shrink-0">
                          {student.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={24} strokeWidth={1} className="text-[#DCDEE0]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-ink">
                            {student.name}
                          </h3>
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <span className="text-muted">현재</span>
                            <span className="text-ink">{exam.currentGrade}</span>
                            <span className="text-muted">→</span>
                            <span className="text-muted">응심</span>
                            <span className="text-ink font-semibold">
                              {exam.targetGrade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 평가 그리드 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="border-t border-[#DCDEE0] pt-4">
                          <div className="flex items-baseline justify-between mb-3">
                            <h4 className="text-base font-semibold text-ink">
                              기본 수련
                            </h4>
                            <div className="text-xs text-muted tabular-nums">
                              {totalBasicSkills}/20
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <StarRating
                              value={exam.basicSkills?.basics || 0}
                              label="기본기"
                              readOnly
                            />
                            <StarRating
                              value={exam.basicSkills?.poomsae || 0}
                              label="품새"
                              readOnly
                            />
                            <StarRating
                              value={exam.basicSkills?.sparring || 0}
                              label="겨루기(연결발차기)"
                              readOnly
                            />
                            <StarRating
                              value={exam.basicSkills?.breaking || 0}
                              label="기술발차기(격파)"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#DCDEE0] pt-4">
                          <div className="flex items-baseline justify-between mb-3">
                            <h4 className="text-base font-semibold text-ink">
                              태도 인성
                            </h4>
                            <div className="text-xs text-muted tabular-nums">
                              {totalAttitude}/20
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <StarRating
                              value={exam.attitude?.concentration || 0}
                              label="집중력"
                              readOnly
                            />
                            <StarRating
                              value={exam.attitude?.challenge || 0}
                              label="도전정신"
                              readOnly
                            />
                            <StarRating
                              value={exam.attitude?.greeting || 0}
                              label="인사성"
                              readOnly
                            />
                            <StarRating
                              value={exam.attitude?.confidence || 0}
                              label="자신감"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#DCDEE0] pt-4">
                          <div className="flex items-baseline justify-between mb-3">
                            <h4 className="text-base font-semibold text-ink">
                              생활 습관
                            </h4>
                            <div className="text-xs text-muted tabular-nums">
                              {totalLifeHabits}/20
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <StarRating
                              value={exam.lifeHabits?.uniform || 0}
                              label="복장상태"
                              readOnly
                            />
                            <StarRating
                              value={exam.lifeHabits?.language || 0}
                              label="바른 언어 사용"
                              readOnly
                            />
                            <StarRating
                              value={exam.lifeHabits?.organization || 0}
                              label="정리 정돈"
                              readOnly
                            />
                            <StarRating
                              value={exam.lifeHabits?.rules || 0}
                              label="규칙 준수"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>

                      {/* 별점 가이드 */}
                      <div className="pt-4 border-t border-[#DCDEE0]">
                        <div className="text-xs font-medium text-muted mb-2.5">별점 평가 기준</div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-1.5">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-1.5">
                              <div className="flex shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={11}
                                    strokeWidth={1.5}
                                    className={
                                      i < rating
                                        ? "fill-ink text-ink"
                                        : "text-[#DCDEE0]"
                                    }
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] lg:text-xs text-ink-soft whitespace-nowrap">
                                {RATING_GUIDE[rating]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 관장님 코멘트 */}
                      {exam.comment && (
                        <div className="pt-4 border-t border-[#DCDEE0]">
                          <div className="text-xs font-medium text-muted mb-2.5">관장님 한줄 코멘트</div>
                          <p className="text-ink leading-loose whitespace-pre-line break-keep">
                            {exam.comment}
                          </p>
                          <div className="mt-2.5 text-right text-xs text-muted">
                            — 백호태권도 관장
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer className="border-t border-[#DCDEE0]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-5 text-xs text-muted">
          © 2026 BAEKHO TAEKWONDO · KOREA NATIONAL SPORT UNIVERSITY
        </div>
      </footer>

      {/* 상장 모달 */}
      {showCertModal && selectedExam && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCDEE0] max-w-4xl w-full p-4 sm:p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink">상장 미리보기</h3>
              <button
                onClick={() => {
                  setShowCertModal(false);
                  setSelectedExam(null);
                }}
                className="p-1.5 hover:bg-[#F8F9FA] transition"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <Certificate ref={certRef} student={student} exam={selectedExam} />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCertModal(false);
                  setSelectedExam(null);
                }}
                className="px-4 py-2.5 border border-[#DCDEE0] text-ink-soft hover:border-ink transition"
              >
                닫기
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-5 py-2.5 bg-point hover:bg-point-dark text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition"
              >
                <Download size={16} />
                {downloading ? "이미지 생성 중..." : "PNG로 다운로드"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
