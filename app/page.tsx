"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, ChevronDown, ChevronUp } from "lucide-react";
import { findStudentByNameAndBirthDate, findVehicleInfoByNameAndBirthDate, loadVehicleSchedules, getVehicleStatus } from "../lib/storage";
import type { StudentVehicleInfo, VehicleSchedule } from "../lib/types";

const BELT_SYSTEM = [
  { grade: "9급", name: "흰띠", color: "bg-white border-2 border-gray-300" },
  { grade: "8급", name: "노란띠", color: "bg-yellow-400" },
  { grade: "7급", name: "초록띠", color: "bg-green-500" },
  { grade: "6급", name: "파란띠", color: "bg-blue-500" },
  { grade: "5급", name: "밤띠", color: "bg-[#8B4513]" },
  { grade: "4급", name: "보라띠", color: "bg-purple-600" },
  { grade: "3급", name: "주황띠", color: "bg-orange-500" },
  { grade: "2급", name: "빨강띠", color: "bg-red-600" },
  { grade: "1급", name: "빨강띠", color: "bg-red-600" },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"exam" | "vehicle">("exam");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBeltModal, setShowBeltModal] = useState(false);
  const [showPoomModal, setShowPoomModal] = useState(false);

  // 심사 조회
  const handleExamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim() || !birthDate) {
      setError("이름과 생년월일을 모두 입력해 주세요.");
      setLoading(false);
      return;
    }

    if (!/^\d{8}$/.test(birthDate)) {
      setError("생년월일은 20150412 형식의 8자리 숫자로 입력해 주세요.");
      setLoading(false);
      return;
    }

    const formatted = `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;

    const student = await findStudentByNameAndBirthDate(name, formatted);
    if (!student) {
      setError("일치하는 학생 정보가 없습니다. 도장에 문의해 주세요.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("baekho-current-student", student.id);
    router.push(`/student/${student.id}`);
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            BAEKHO TAEKWONDO
          </span>
          <a
            href="/admin"
            className="text-xs text-muted hover:text-ink transition"
          >
            관리자
          </a>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-10 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-7">
            <img
              src="/bhlogo.svg"
              alt="백호태권도 로고"
              className="w-[110px] mb-4"
            />

            <h1 className="text-ink leading-[1.0] font-semibold text-5xl sm:text-6xl lg:text-[5.5rem]">
              백호태권도
            </h1>

            <p className="mt-5 text-base sm:text-lg text-ink-soft max-w-md leading-relaxed">
              우리 아이의 한 걸음, 한 동작이 모여
              <br />
              단단한 성장의 기록이 됩니다.
            </p>

            <div className="mt-4 text-sm text-ink-soft">
              한국체육대학교 백호태권도 & 점프윙스
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowBeltModal(true)}
                className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink border border-line hover:border-ink px-4 py-2 transition"
              >
                유급자 띠 체계 보기
              </button>
              <button
                onClick={() => setShowPoomModal(true)}
                className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink border border-line hover:border-ink px-4 py-2 transition"
              >
                유품자 급수 과정 보기
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-12">
            <div className="border border-line">
              {/* 탭 헤더 */}
              <div className="flex border-b border-line">
                <button
                  onClick={() => {
                    setActiveTab("exam");
                    setError("");
                    setName("");
                    setBirthDate("");
                  }}
                  className={`flex-1 px-4 py-3.5 text-sm font-semibold transition ${
                    activeTab === "exam"
                      ? "bg-ink text-paper"
                      : "bg-paper text-muted hover:text-ink"
                  }`}
                >
                  심사 조회
                </button>
                <button
                  onClick={() => {
                    setActiveTab("vehicle");
                    setError("");
                    setName("");
                    setBirthDate("");
                  }}
                  className={`flex-1 px-4 py-3.5 text-sm font-semibold transition border-l border-line ${
                    activeTab === "vehicle"
                      ? "bg-ink text-paper"
                      : "bg-paper text-muted hover:text-ink"
                  }`}
                >
                  차량 등하원 시간 조회
                </button>
              </div>

              {/* 탭 콘텐츠 */}
              <div className="p-6 sm:p-7">
                {activeTab === "exam" ? (
                  <ExamSearchTab
                    name={name}
                    birthDate={birthDate}
                    error={error}
                    loading={loading}
                    onNameChange={setName}
                    onBirthDateChange={setBirthDate}
                    onSubmit={handleExamLogin}
                  />
                ) : (
                  <VehicleSearchTab />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 sm:py-14 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          <Feature
            t="별점심사"
            b="태권도기술 · 태도 · 생활습관 영역을 별점으로 심사합니다."
          />
          <Feature
            t="성장레포트"
            b="심사결과를 성장 레포트로 확인할 수 있습니다."
          />
          <Feature
            t="성장의 기록"
            b="매 심사마다 누적되는 성장리포트 및 영상으로 우리 아이의 변화를 살펴볼 수 있습니다."
          />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-5 text-xs text-muted">
          © 2026 BAEKHO TAEKWONDO · KOREA NATIONAL SPORT UNIVERSITY
        </div>
      </footer>

      {showBeltModal && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowBeltModal(false)}
        >
          <div
            className="bg-white border border-[#DCDEE0] max-w-3xl w-full p-5 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A]">
                유급자 띠 체계
              </h3>
              <button
                onClick={() => setShowBeltModal(false)}
                className="p-1.5 hover:bg-[#F8F9FA] transition"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="hidden sm:flex justify-center items-end gap-3 overflow-x-auto pb-2">
              {BELT_SYSTEM.map((belt) => (
                <div
                  key={belt.grade}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${belt.color} shadow-sm`}
                  />
                  <div className="text-center">
                    <div className="text-[11px] font-semibold text-[#1A1A1A] whitespace-nowrap">
                      {belt.grade}
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-0.5 whitespace-nowrap">
                      {belt.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sm:hidden grid grid-cols-3 gap-3">
              {BELT_SYSTEM.map((belt) => (
                <div
                  key={belt.grade}
                  className="flex flex-col items-center gap-1.5 p-2 border border-[#DCDEE0] hover:bg-[#F8F9FA] transition"
                >
                  <div
                    className={`w-10 h-10 rounded-full ${belt.color} shadow-sm`}
                  />
                  <div className="text-center">
                    <div className="text-[10px] font-semibold text-[#1A1A1A]">
                      {belt.grade}
                    </div>
                    <div className="text-[9px] text-[#6B7280] mt-0.5">
                      {belt.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-[10px] sm:text-xs text-[#6B7280] text-center">
              각 급수마다 심사를 통해 다음 단계로 승급합니다.
            </div>
          </div>
        </div>
      )}

      {showPoomModal && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPoomModal(false)}
        >
          <div
            className="bg-white border border-[#DCDEE0] max-w-2xl w-full p-5 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A]">
                유품자 급수 과정
              </h3>
              <button
                onClick={() => setShowPoomModal(false)}
                className="p-1.5 hover:bg-[#F8F9FA] transition"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F8F9FA] p-4 sm:p-5 rounded-sm">
                <div className="text-sm sm:text-base font-semibold text-[#1A1A1A] mb-3">
                  1품
                </div>
                <div className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  12급까지의 교육과정
                </div>
              </div>

              <div className="bg-[#F8F9FA] p-4 sm:p-5 rounded-sm">
                <div className="text-sm sm:text-base font-semibold text-[#1A1A1A] mb-3">
                  2품
                </div>
                <div className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  24급까지의 교육과정
                </div>
              </div>

              <div className="bg-[#F8F9FA] p-4 sm:p-5 rounded-sm">
                <div className="text-sm sm:text-base font-semibold text-[#1A1A1A] mb-3">
                  3품
                </div>
                <div className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  36급까지의 교육과정
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#DCDEE0] text-[10px] sm:text-xs text-[#6B7280] text-center">
              각 품 과정은 연령과 실력에 따라 진행됩니다.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 심사 조회 탭
function ExamSearchTab({
  name,
  birthDate,
  error,
  loading,
  onNameChange,
  onBirthDateChange,
  onSubmit,
}: {
  name: string;
  birthDate: string;
  error: string;
  loading: boolean;
  onNameChange: (v: string) => void;
  onBirthDateChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <h2 className="text-xl font-semibold text-ink">심사 결과 조회</h2>
      <p className="text-sm text-muted mt-1">학부모 로그인</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="학생 이름">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="홍길동"
            className="form-input"
          />
        </Field>

        <Field label="생년월일 8자리">
          <input
            type="text"
            inputMode="numeric"
            value={birthDate}
            onChange={(e) =>
              onBirthDateChange(
                e.target.value.replace(/\D/g, "").slice(0, 8),
              )
            }
            maxLength={8}
            placeholder="예) 20150412"
            className="form-input tracking-wider"
            autoComplete="off"
          />
          <p className="text-xs text-muted mt-2">
            숫자 8자리를 비밀번호처럼 입력해 주세요.
          </p>
        </Field>

        {error && (
          <div className="text-xs text-point border border-point/40 px-3 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-point hover:bg-point-dark transition text-white font-semibold py-3.5 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          {loading ? "조회 중..." : "조회하기"}
          <ArrowRight size={16} />
        </button>
      </form>
    </>
  );
}

// 차량 조회 탭
function VehicleSearchTab() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    vehicles: StudentVehicleInfo[];
    schedules: VehicleSchedule[];
  } | null>(null);

  const handleVehicleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearchResult(null);

    if (!name.trim() || !birthDate) {
      setError("이름과 생년월일을 모두 입력해 주세요.");
      setLoading(false);
      return;
    }

    if (!/^\d{8}$/.test(birthDate)) {
      setError("생년월일은 20150412 형식의 8자리 숫자로 입력해 주세요.");
      setLoading(false);
      return;
    }

    const formatted = `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;

    try {
      const vehicles = await findVehicleInfoByNameAndBirthDate(name, formatted);

      if (vehicles.length === 0) {
        setError("입력하신 정보와 일치하는 차량 운행 정보를 찾을 수 없습니다. 이름과 생년월일을 다시 확인해주세요.");
        setLoading(false);
        return;
      }

      // 해당 차량 정보의 게시물 조회
      const schedules = await loadVehicleSchedules();
      const scheduleIds = [...new Set(vehicles.map(v => v.scheduleId))];
      const matchedSchedules = schedules
        .filter(s => scheduleIds.includes(s.id) && s.isPublished)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)); // 최신순

      setSearchResult({ vehicles, schedules: matchedSchedules });
    } catch (err) {
      console.error(err);
      setError("조회 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {!searchResult ? (
        <>
          <h2 className="text-xl font-semibold text-ink">차량 등하원 시간 조회</h2>
          <p className="text-sm text-muted mt-1">학부모 조회</p>

          <form onSubmit={handleVehicleSearch} className="mt-6 space-y-4">
            <Field label="학생 이름">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="form-input"
              />
            </Field>

            <Field label="생년월일 8자리">
              <input
                type="text"
                inputMode="numeric"
                value={birthDate}
                onChange={(e) =>
                  setBirthDate(
                    e.target.value.replace(/\D/g, "").slice(0, 8),
                  )
                }
                maxLength={8}
                placeholder="예) 20150412"
                className="form-input tracking-wider"
                autoComplete="off"
              />
              <p className="text-xs text-muted mt-2">
                숫자 8자리를 비밀번호처럼 입력해 주세요.
              </p>
            </Field>

            {error && (
              <div className="text-xs text-point border border-point/40 px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-point hover:bg-point-dark transition text-white font-semibold py-3.5 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? "조회 중..." : "조회하기"}
              <ArrowRight size={16} />
            </button>
          </form>
        </>
      ) : (
        <VehicleSearchResult
          result={searchResult}
          onBack={() => {
            setSearchResult(null);
            setName("");
            setBirthDate("");
          }}
          onPrint={handlePrint}
        />
      )}
    </>
  );
}

// 차량 조회 결과
function VehicleSearchResult({
  result,
  onBack,
  onPrint,
}: {
  result: {
    vehicles: StudentVehicleInfo[];
    schedules: VehicleSchedule[];
  };
  onBack: () => void;
  onPrint: () => void;
}) {
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(
    result.schedules.find(s => getVehicleStatus(s.startDate, s.endDate) === "active")?.id ?? result.schedules[0]?.id ?? null
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="text-sm text-ink-soft hover:text-ink inline-flex items-center gap-1"
        >
          <ArrowRight size={14} className="rotate-180" /> 다시 조회하기
        </button>
        <button
          onClick={onPrint}
          className="text-xs px-3 py-1.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition"
        >
          인쇄하기
        </button>
      </div>

      <div className="space-y-2">
        {result.schedules.map((schedule) => {
          const vehicleInfo = result.vehicles.find(v => v.scheduleId === schedule.id);
          if (!vehicleInfo) return null;

          const status = getVehicleStatus(schedule.startDate, schedule.endDate);
          const isExpanded = expandedSchedule === schedule.id;

          return (
            <div key={schedule.id} className="border border-line">
              <button
                onClick={() => setExpandedSchedule(isExpanded ? null : schedule.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-line-soft transition print:hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-ink">
                    {schedule.title}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-1 ${
                      status === "active"
                        ? "bg-point text-white"
                        : status === "upcoming"
                          ? "border border-ink text-ink"
                          : "border border-line text-muted"
                    }`}
                  >
                    {status === "active" ? "운행 중" : status === "upcoming" ? "예정" : "운행 종료"}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* 인쇄 시에는 펼쳐진 상태 */}
              {(isExpanded || true) && (
                <div className={`border-t border-line p-4 space-y-4 ${!isExpanded && "hidden print:block"}`}>
                  <div className="text-sm text-muted">
                    운행 기간: {schedule.startDate} ~ {schedule.endDate}
                  </div>

                  {vehicleInfo.pickupEnabled && (
                    <div className="border border-line p-4">
                      <h4 className="text-sm font-semibold text-ink mb-3">등원</h4>
                      <div className="space-y-2 text-sm">
                        {vehicleInfo.pickupLocation && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">장소:</span>
                            <span className="text-ink font-medium">{vehicleInfo.pickupLocation}</span>
                          </div>
                        )}
                        {vehicleInfo.pickupTime && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">시간:</span>
                            <span className="text-ink font-medium">{vehicleInfo.pickupTime}</span>
                          </div>
                        )}
                        {vehicleInfo.pickupVehicle && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">차량:</span>
                            <span className="text-ink">{vehicleInfo.pickupVehicle}</span>
                          </div>
                        )}
                        {vehicleInfo.pickupManager && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">담당자:</span>
                            <span className="text-ink">{vehicleInfo.pickupManager}</span>
                          </div>
                        )}
                        {vehicleInfo.pickupNote && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">비고:</span>
                            <span className="text-ink-soft">{vehicleInfo.pickupNote}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!vehicleInfo.pickupEnabled && (
                    <div className="border border-line p-4 bg-line-soft">
                      <h4 className="text-sm font-semibold text-ink mb-1">등원</h4>
                      <p className="text-sm text-muted">개별 등원</p>
                    </div>
                  )}

                  {vehicleInfo.dropoffEnabled && (
                    <div className="border border-line p-4">
                      <h4 className="text-sm font-semibold text-ink mb-3">하원</h4>
                      <div className="space-y-2 text-sm">
                        {vehicleInfo.dropoffLocation && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">장소:</span>
                            <span className="text-ink font-medium">{vehicleInfo.dropoffLocation}</span>
                          </div>
                        )}
                        {vehicleInfo.dropoffTime && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">시간:</span>
                            <span className="text-ink font-medium">{vehicleInfo.dropoffTime}</span>
                          </div>
                        )}
                        {vehicleInfo.dropoffVehicle && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">차량:</span>
                            <span className="text-ink">{vehicleInfo.dropoffVehicle}</span>
                          </div>
                        )}
                        {vehicleInfo.dropoffManager && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">담당자:</span>
                            <span className="text-ink">{vehicleInfo.dropoffManager}</span>
                          </div>
                        )}
                        {vehicleInfo.dropoffNote && (
                          <div className="flex gap-2">
                            <span className="text-muted min-w-[60px]">비고:</span>
                            <span className="text-ink-soft">{vehicleInfo.dropoffNote}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!vehicleInfo.dropoffEnabled && (
                    <div className="border border-line p-4 bg-line-soft">
                      <h4 className="text-sm font-semibold text-ink mb-1">하원</h4>
                      <p className="text-sm text-muted">개별 하원</p>
                    </div>
                  )}

                  {schedule.notice && (
                    <div className="border-t border-line pt-4 mt-4">
                      <h4 className="text-xs font-medium text-muted mb-2">안내사항</h4>
                      <p className="text-sm text-ink-soft whitespace-pre-line">{schedule.notice}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Feature({ t, b }: { t: string; b: string }) {
  return (
    <div className="md:px-8 first:md:pl-0 last:md:pr-0 md:border-r md:border-line last:md:border-r-0">
      <h3 className="font-semibold text-ink text-base">{t}</h3>
      <p className="text-sm text-ink-soft leading-relaxed mt-2">{b}</p>
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
      <span className="block text-xs font-medium text-ink-soft mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
