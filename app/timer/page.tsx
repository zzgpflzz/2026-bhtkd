"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "timer" | "stopwatch";

const PRESETS = [60, 180, 300, 600]; // 1분, 3분, 5분, 10분

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("timer");

  // --- 카운트다운 타이머 상태 ---
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- 스톱워치 상태 ---
  const [elapsedMs, setElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // admin에서 설정한 모드/시간 불러오기
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("timerModeActive");
      if (savedMode === "timer" || savedMode === "stopwatch") {
        setMode(savedMode);
      }
      const saved = localStorage.getItem("timerDurationActive");
      if (saved) {
        const secs = parseInt(saved, 10);
        if (!isNaN(secs) && secs > 0) {
          setInitialSeconds(secs);
          setRemaining(secs);
        }
      }
    } catch (error) {
      console.error("Failed to load timer settings:", error);
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        const startAt = ctx.currentTime + i * 0.4;
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + 0.4);
      }
    } catch (error) {
      // 오디오 재생 실패는 무시 (예: 자동재생 정책)
    }
  }, []);

  // 카운트다운 인터벌
  useEffect(() => {
    if (mode === "timer" && isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, isRunning, playBeep]);

  // 스톱워치 애니메이션 루프
  useEffect(() => {
    function tick() {
      setElapsedMs(Date.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    if (mode === "stopwatch" && swRunning) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, swRunning]);

  function switchMode(next: Mode) {
    setIsRunning(false);
    setSwRunning(false);
    setMode(next);
  }

  // 타이머 핸들러
  function handleTimerStartPause() {
    if (remaining <= 0) return;
    setIsRunning((r) => !r);
  }
  function handleTimerReset() {
    setIsRunning(false);
    setRemaining(initialSeconds);
  }
  function handlePreset(secs: number) {
    setIsRunning(false);
    setInitialSeconds(secs);
    setRemaining(secs);
  }
  function formatPreset(secs: number) {
    return secs % 60 === 0 ? `${secs / 60}분` : `${secs}초`;
  }

  // 스톱워치 핸들러
  function handleSwStartPause() {
    if (swRunning) {
      setSwRunning(false);
    } else {
      startTimeRef.current = Date.now() - elapsedMs;
      setSwRunning(true);
    }
  }
  function handleSwReset() {
    setSwRunning(false);
    setElapsedMs(0);
    setLaps([]);
  }
  function handleSwLap() {
    if (!swRunning) return;
    setLaps((prev) => [elapsedMs, ...prev]);
  }
  function formatSw(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return {
      main: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      cs: String(cs).padStart(2, "0"),
    };
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isFinished = remaining === 0;
  const isUrgent = remaining > 0 && remaining <= 10;
  const sw = formatSw(elapsedMs);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 sm:p-10 relative">
      {/* 모드 전환 탭 */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 inline-flex border border-white/20 rounded-lg overflow-hidden">
        <button
          onClick={() => switchMode("timer")}
          className={`px-4 py-2 text-sm sm:text-base font-semibold transition ${
            mode === "timer"
              ? "bg-white text-black"
              : "bg-transparent text-gray-300 hover:text-white"
          }`}
        >
          타이머
        </button>
        <button
          onClick={() => switchMode("stopwatch")}
          className={`px-4 py-2 text-sm sm:text-base font-semibold transition border-l border-white/20 ${
            mode === "stopwatch"
              ? "bg-white text-black"
              : "bg-transparent text-gray-300 hover:text-white"
          }`}
        >
          스톱워치
        </button>
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center">
        {mode === "timer" ? (
          <>
            <div
              className={`font-black tabular-nums tracking-tighter leading-none mb-10 transition-colors duration-300 ${
                isFinished
                  ? "text-red-500"
                  : isUrgent
                  ? "text-red-400"
                  : "text-white"
              }`}
              style={{ fontSize: "clamp(6rem, 24vw, 20rem)" }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {isFinished && (
              <div className="mb-10 text-3xl sm:text-5xl font-bold text-red-500 animate-pulse">
                시간 종료!
              </div>
            )}

            <div className="flex gap-6 mb-14">
              <button
                onClick={handleTimerStartPause}
                disabled={remaining <= 0}
                className={`px-10 py-6 sm:px-16 sm:py-8 rounded-2xl text-2xl sm:text-4xl font-bold transition-all ${
                  remaining <= 0
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : isRunning
                    ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                    : "bg-green-500 hover:bg-green-400 text-black"
                }`}
              >
                {isRunning ? "일시정지" : "시작"}
              </button>
              <button
                onClick={handleTimerReset}
                className="px-10 py-6 sm:px-16 sm:py-8 rounded-2xl text-2xl sm:text-4xl font-bold bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 transition-all"
              >
                재설정
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {PRESETS.map((secs) => (
                <button
                  key={secs}
                  onClick={() => handlePreset(secs)}
                  className={`px-5 py-3 rounded-lg text-base sm:text-lg font-semibold border transition-all ${
                    initialSeconds === secs
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-gray-300 border-white/30 hover:border-white/60 hover:text-white"
                  }`}
                >
                  {formatPreset(secs)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              className="font-black tabular-nums tracking-tighter leading-none mb-10 text-white flex items-baseline"
              style={{ fontSize: "clamp(5rem, 20vw, 16rem)" }}
            >
              <span>{sw.main}</span>
              <span className="text-gray-400" style={{ fontSize: "0.4em" }}>
                .{sw.cs}
              </span>
            </div>

            <div className="flex gap-4 sm:gap-6 mb-14">
              <button
                onClick={handleSwStartPause}
                className={`px-8 py-6 sm:px-16 sm:py-8 rounded-2xl text-2xl sm:text-4xl font-bold transition-all ${
                  swRunning
                    ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                    : "bg-green-500 hover:bg-green-400 text-black"
                }`}
              >
                {swRunning ? "일시정지" : "시작"}
              </button>
              <button
                onClick={handleSwLap}
                disabled={!swRunning}
                className={`px-8 py-6 sm:px-16 sm:py-8 rounded-2xl text-2xl sm:text-4xl font-bold transition-all ${
                  !swRunning
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-400 text-white"
                }`}
              >
                랩
              </button>
              <button
                onClick={handleSwReset}
                className="px-8 py-6 sm:px-16 sm:py-8 rounded-2xl text-2xl sm:text-4xl font-bold bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 transition-all"
              >
                재설정
              </button>
            </div>

            {laps.length > 0 && (
              <div className="w-full max-w-md max-h-[30vh] overflow-y-auto space-y-2 px-4">
                {laps.map((lap, idx) => {
                  const lapTime = formatSw(lap);
                  return (
                    <div
                      key={laps.length - idx}
                      className="flex justify-between text-lg sm:text-xl text-gray-300 border-b border-white/10 pb-2"
                    >
                      <span>랩 {laps.length - idx}</span>
                      <span className="tabular-nums">
                        {lapTime.main}.{lapTime.cs}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
