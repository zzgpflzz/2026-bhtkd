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
  const [title, setTitle] = useState("SCOREBOARD");

  useEffect(() => {
    // localStorage에서 팀 데이터 가져오기
    try {
      const scoreboardTeamsActive = localStorage.getItem("scoreboardTeamsActive");
      if (scoreboardTeamsActive) {
        const parsed = JSON.parse(scoreboardTeamsActive);
        const teamsWithScore = parsed.map((team: any) => ({
          ...team,
          score: 0,
        }));
        setTeams(teamsWithScore);
      }
      const scoreboardTitleActive = localStorage.getItem("scoreboardTitleActive");
      if (scoreboardTitleActive) {
        setTitle(scoreboardTitleActive);
      }
    } catch (error) {
      console.error("Failed to load scoreboard data:", error);
    }
  }, []);

  const handleChangeScore = (id: string, delta: number) => {
    setTeams(
      teams.map((t) =>
        t.id === id ? { ...t, score: Math.max(0, t.score + delta) } : t
      )
    );
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">

      {/* 스코어보드 컨테이너 */}
      <div className="relative z-10 w-full max-w-7xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white mb-2 tracking-tighter">
              {title}
            </h1>
            <div className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </div>
        </div>

        {/* 팀별 스코어 */}
        <div
          className={`grid gap-8 ${
            teams.length === 2
              ? "grid-cols-2 max-w-6xl mx-auto"
              : teams.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 스코어 카드 */}
              <div
                className="relative rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300"
                style={{ backgroundColor: team.color }}
              >

                {/* 팀 이름 */}
                <div className="relative text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide uppercase">
                    {team.name}
                  </h2>
                </div>

                {/* 점수 디스플레이 */}
                <div className="relative mb-10 px-4">
                  <div className="text-center py-12 relative">
                    {/* 점수 숫자 */}
                    <div
                      className="font-black tabular-nums text-white"
                      style={{
                        fontSize: (() => {
                          const digits = String(team.score).length;
                          if (teams.length === 2) {
                            // 2팀일 때
                            if (digits <= 2) return 'clamp(10rem, 22vw, 18rem)';
                            if (digits === 3) return 'clamp(8rem, 18vw, 14rem)';
                            if (digits === 4) return 'clamp(6rem, 14vw, 11rem)';
                            return 'clamp(5rem, 12vw, 9rem)';
                          } else {
                            // 3-4팀일 때
                            if (digits <= 2) return 'clamp(7rem, 16vw, 13rem)';
                            if (digits === 3) return 'clamp(5.5rem, 13vw, 10rem)';
                            if (digits === 4) return 'clamp(4.5rem, 11vw, 8rem)';
                            return 'clamp(4rem, 10vw, 7rem)';
                          }
                        })(),
                        lineHeight: '1',
                        letterSpacing: String(team.score).length >= 3 ? '-0.05em' : '-0.02em',
                      }}
                    >
                      {team.score}
                    </div>
                  </div>
                </div>

                {/* 컨트롤 버튼 */}
                <div className="relative space-y-3">
                  {/* + 버튼 */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleChangeScore(team.id, 100)}
                      className="py-4 bg-black/20 hover:bg-black/30 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => handleChangeScore(team.id, 10)}
                      className="py-4 bg-black/20 hover:bg-black/30 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleChangeScore(team.id, 1)}
                      className="py-4 bg-black/20 hover:bg-black/30 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      +1
                    </button>
                  </div>
                  {/* - 버튼 */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleChangeScore(team.id, -100)}
                      className="py-4 bg-black/30 hover:bg-black/40 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      -100
                    </button>
                    <button
                      onClick={() => handleChangeScore(team.id, -10)}
                      className="py-4 bg-black/30 hover:bg-black/40 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleChangeScore(team.id, -1)}
                      className="py-4 bg-black/30 hover:bg-black/40 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
      `}</style>
    </main>
  );
}
