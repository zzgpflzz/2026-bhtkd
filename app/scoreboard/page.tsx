"use client";

import { useState, useEffect } from "react";

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export default function ScoreboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // localStorage에서 팀 데이터 가져오기
    try {
      const scoreboardTeamsActive = localStorage.getItem("scoreboardTeamsActive");
      if (scoreboardTeamsActive) {
        const parsed = JSON.parse(scoreboardTeamsActive);
        // 점수 0으로 초기화하여 설정
        const teamsWithScore = parsed.map((team: any) => ({
          ...team,
          score: 0,
        }));
        setTeams(teamsWithScore);
      }
    } catch (error) {
      console.error("Failed to load scoreboard data:", error);
    }
  }, []);

  // 점수 변경
  const handleChangeScore = (id: string, delta: number) => {
    setTeams(
      teams.map((t) =>
        t.id === id ? { ...t, score: Math.max(0, t.score + delta) } : t
      )
    );
  };

  // 점수를 자릿수로 분리 (최대 3자리)
  const getDigits = (score: number): string[] => {
    const str = String(score).padStart(3, "0");
    return str.split("");
  };

  if (teams.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">점수기록판</h1>
          <p className="text-xl text-gray-400">팀 데이터를 불러올 수 없습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-8">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 drop-shadow-2xl tracking-tight">
          🏆 SCOREBOARD 🏆
        </h1>
      </div>

      {/* 스코어보드 그리드 */}
      <div
        className={`grid gap-12 mb-12 ${
          teams.length === 2
            ? "grid-cols-2"
            : teams.length === 3
            ? "grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {teams.map((team, index) => {
          const digits = getDigits(team.score);

          return (
            <div
              key={team.id}
              className="flex flex-col items-center gap-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* 팀 이름 */}
              <div className="text-center mb-2">
                <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  {team.name}
                </h2>
              </div>

              {/* 플립보드 스타일 점수판 */}
              <div className="relative">
                {/* 베이스 */}
                <div className="bg-gray-950 rounded-2xl p-6 shadow-2xl border-4 border-gray-800">
                  {/* 점수 카드들 */}
                  <div className="flex gap-3">
                    {digits.map((digit, idx) => (
                      <div
                        key={idx}
                        className="flip-card relative rounded-xl overflow-hidden shadow-2xl"
                        style={{
                          backgroundColor: team.color,
                          width: "100px",
                          height: "140px",
                        }}
                      >
                        {/* 링 홀 효과 (상단) */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 rounded-full shadow-inner" />

                        {/* 숫자 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-8xl font-black text-white drop-shadow-2xl">
                            {digit}
                          </span>
                        </div>

                        {/* 중간 구분선 */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 점수 조절 버튼 */}
              <div className="flex flex-col gap-3">
                {/* + 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChangeScore(team.id, 100)}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => handleChangeScore(team.id, 10)}
                    className="px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleChangeScore(team.id, 1)}
                    className="px-5 py-3 bg-green-400 hover:bg-green-500 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    +1
                  </button>
                </div>
                {/* - 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChangeScore(team.id, -100)}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    -100
                  </button>
                  <button
                    onClick={() => handleChangeScore(team.id, -10)}
                    className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleChangeScore(team.id, -1)}
                    className="px-5 py-3 bg-red-400 hover:bg-red-500 text-white font-bold text-base rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out backwards;
        }
        .flip-card {
          transform-style: preserve-3d;
        }
      `}</style>
    </main>
  );
}
