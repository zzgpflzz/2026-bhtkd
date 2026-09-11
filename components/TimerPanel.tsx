"use client";

import { useState, useEffect } from "react";
import { Timer as TimerIcon, Watch } from "lucide-react";

type Mode = "timer" | "stopwatch";

export default function TimerPanel() {
  const [mode, setMode] = useState<Mode>("timer");
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const savedMode = localStorage.getItem("timerModeActive");
    if (savedMode === "timer" || savedMode === "stopwatch") {
      setMode(savedMode);
    }
    const savedTimer = localStorage.getItem("timerDurationActive");
    if (savedTimer) {
      const secs = parseInt(savedTimer, 10);
      if (!isNaN(secs) && secs > 0) {
        setTimerMinutes(Math.floor(secs / 60));
        setTimerSeconds(secs % 60);
      }
    }
  }, []);

  function saveTimerMinutes(value: number) {
    setTimerMinutes(Math.max(0, Math.min(59, value)));
  }

  function saveTimerSeconds(value: number) {
    setTimerSeconds(Math.max(0, Math.min(59, value)));
  }

  function handleOpen() {
    localStorage.setItem("timerModeActive", mode);
    if (mode === "timer") {
      const totalSeconds = timerMinutes * 60 + timerSeconds;
      if (totalSeconds <= 0) {
        alert("타이머 시간을 설정해주세요.");
        return;
      }
      localStorage.setItem("timerDurationActive", String(totalSeconds));
    }
    window.open("/timer", "_blank", "fullscreen=yes,width=1920,height=1080");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-2">타이머 / 스톱워치</h1>
        <p className="text-sm text-muted">
          레크레이션 활동에 사용할 타이머 또는 스톱워치를 큰 화면으로 여세요.
        </p>
      </div>

      {/* 모드 선택 */}
      <div className="mb-6 inline-flex border border-line">
        <button
          onClick={() => setMode("timer")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            mode === "timer"
              ? "bg-ink text-white"
              : "bg-white text-ink-soft hover:text-ink"
          }`}
        >
          <TimerIcon size={16} />
          타이머
        </button>
        <button
          onClick={() => setMode("stopwatch")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-l border-line ${
            mode === "stopwatch"
              ? "bg-ink text-white"
              : "bg-white text-ink-soft hover:text-ink"
          }`}
        >
          <Watch size={16} />
          스톱워치
        </button>
      </div>

      {mode === "timer" && (
        <div className="mb-6 border border-line p-4 bg-white max-w-sm">
          <label className="block text-sm font-medium text-ink mb-2">
            타이머 시간
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={59}
              value={timerMinutes}
              onChange={(e) => saveTimerMinutes(parseInt(e.target.value, 10) || 0)}
              className="form-input w-20 text-center"
            />
            <span className="text-sm text-muted">분</span>
            <input
              type="number"
              min={0}
              max={59}
              value={timerSeconds}
              onChange={(e) => saveTimerSeconds(parseInt(e.target.value, 10) || 0)}
              className="form-input w-20 text-center"
            />
            <span className="text-sm text-muted">초</span>
          </div>
          <p className="text-xs text-muted mt-1">
            타이머 화면을 열 때 설정된 시간으로 시작합니다.
          </p>
        </div>
      )}

      {mode === "stopwatch" && (
        <div className="mb-6 border border-line p-4 bg-white max-w-sm text-sm text-muted">
          0부터 시작하는 스톱워치를 큰 화면으로 엽니다. 큰 화면에서 시작·랩·재설정을 조작할 수 있어요.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink/85 text-white transition"
        >
          {mode === "timer" ? <TimerIcon size={18} /> : <Watch size={18} />}
          {mode === "timer" ? "타이머 열기" : "스톱워치 열기"}
        </button>
      </div>
    </div>
  );
}
