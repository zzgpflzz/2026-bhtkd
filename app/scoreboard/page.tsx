"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

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

  // 최고 점수 찾기
  const maxScore = Math.max(...teams.map((t) => t.score), 0);

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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 drop-shadow-2xl animate-fade-in tracking-tight">
            🏆 점수판 🏆
          </h1>
        </div>

        {/* 스코어보드 */}
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team, index) => {
            // 점수에 따른 바 너비 계산
            const barWidth = maxScore > 0 ? (team.score / maxScore) * 100 : 0;

            return (
              <div
                key={team.id}
                className="relative overflow-hidden rounded-2xl shadow-2xl animate-slide-in"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* 배경 바 (점수에 따라 늘어남) */}
                <div
                  className="absolute inset-0 transition-all duration-500 ease-out"
                  style={{
                    background: `linear-gradient(90deg, ${team.color} 0%, ${team.color}CC ${barWidth}%, #1a1a1a ${barWidth}%)`,
                  }}
                />

                {/* 컨텐츠 */}
                <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between gap-4">
                  {/* 팀 이름 */}
                  <div className="flex-1">
                    <h2
                      className="text-3xl sm:text-5xl font-black drop-shadow-lg"
                      style={{
                        color: barWidth > 30 ? '#000000' : '#ffffff',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {team.name}
                    </h2>
                  </div>

                  {/* 점수 */}
                  <div
                    className="text-6xl sm:text-8xl font-black drop-shadow-2xl min-w-[200px] text-right"
                    style={{
                      color: barWidth > 50 ? '#000000' : team.color,
                      transition: 'color 0.3s ease',
                      textShadow: barWidth > 50 ? '4px 4px 8px rgba(0,0,0,0.3)' : `4px 4px 12px ${team.color}`,
                    }}
                  >
                    {team.score}
                  </div>

                  {/* 점수 조절 버튼 */}
                  <div className="flex flex-col gap-2">
                    {/* + 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeScore(team.id, 100)}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        +100
                      </button>
                      <button
                        onClick={() => handleChangeScore(team.id, 10)}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleChangeScore(team.id, 1)}
                        className="px-4 py-3 bg-green-400 hover:bg-green-500 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        +1
                      </button>
                    </div>
                    {/* - 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeScore(team.id, -100)}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        -100
                      </button>
                      <button
                        onClick={() => handleChangeScore(team.id, -10)}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleChangeScore(team.id, -1)}
                        className="px-4 py-3 bg-red-400 hover:bg-red-500 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        -1
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.6s ease-out backwards;
        }
      `}</style>
    </main>
  );
}
