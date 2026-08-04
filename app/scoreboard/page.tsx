"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, Edit2, Check, X } from "lucide-react";

interface Team {
  id: string;
  name: string;
  score: number;
}

export default function ScoreboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");

  // 팀 추가
  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      alert("팀 이름을 입력해주세요.");
      return;
    }
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      score: 0,
    };
    setTeams([...teams, newTeam]);
    setNewTeamName("");
  };

  // 팀 삭제
  const handleDeleteTeam = (id: string) => {
    if (confirm("이 팀을 삭제하시겠습니까?")) {
      setTeams(teams.filter((t) => t.id !== id));
    }
  };

  // 점수 증가
  const handleIncreaseScore = (id: string, amount: number) => {
    setTeams(
      teams.map((t) => (t.id === id ? { ...t, score: t.score + amount } : t))
    );
  };

  // 점수 감소
  const handleDecreaseScore = (id: string, amount: number) => {
    setTeams(
      teams.map((t) =>
        t.id === id ? { ...t, score: Math.max(0, t.score - amount) } : t
      )
    );
  };

  // 팀 이름 수정 시작
  const startEditingTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  // 팀 이름 수정 저장
  const saveEditingTeam = () => {
    if (!editingTeamName.trim()) {
      alert("팀 이름을 입력해주세요.");
      return;
    }
    setTeams(
      teams.map((t) =>
        t.id === editingTeamId ? { ...t, name: editingTeamName.trim() } : t
      )
    );
    setEditingTeamId(null);
    setEditingTeamName("");
  };

  // 팀 이름 수정 취소
  const cancelEditingTeam = () => {
    setEditingTeamId(null);
    setEditingTeamName("");
  };

  // 점수 순으로 정렬
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-paper text-ink p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">
            팀 점수기록판
          </h1>
          <p className="text-sm text-muted">
            팀을 추가하고 점수를 기록하세요 (새로고침 시 초기화됨)
          </p>
        </div>

        {/* 팀 추가 입력 */}
        <div className="mb-6 border border-line p-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
              placeholder="팀 이름 입력"
              className="flex-1 px-4 py-2 border border-line focus:outline-none focus:border-ink"
            />
            <button
              onClick={handleAddTeam}
              className="px-6 py-2 bg-point hover:bg-point-dark text-white font-semibold inline-flex items-center gap-2 transition"
            >
              <Plus size={18} />
              팀 추가
            </button>
          </div>
        </div>

        {/* 팀 목록 */}
        {teams.length === 0 ? (
          <div className="border border-line p-12 text-center text-muted">
            팀을 추가하여 점수 기록을 시작하세요.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                className="border-2 border-line p-4 bg-white hover:border-ink transition"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* 순위 */}
                  <div className="text-2xl font-bold text-muted w-12 text-center">
                    {index + 1}
                  </div>

                  {/* 팀 이름 */}
                  <div className="flex-1">
                    {editingTeamId === team.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && saveEditingTeam()
                          }
                          className="flex-1 px-3 py-2 border border-ink focus:outline-none text-xl font-semibold"
                          autoFocus
                        />
                        <button
                          onClick={saveEditingTeam}
                          className="px-3 py-2 bg-ink text-white hover:bg-ink/85 transition"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditingTeam}
                          className="px-3 py-2 border border-line hover:border-ink transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-ink">
                          {team.name}
                        </h3>
                        <button
                          onClick={() => startEditingTeam(team)}
                          className="p-1 text-muted hover:text-ink transition"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 점수 */}
                  <div className="text-4xl font-bold text-point min-w-[120px] text-center">
                    {team.score}
                  </div>

                  {/* 점수 조절 버튼 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleIncreaseScore(team.id, 10)}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold transition"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleIncreaseScore(team.id, 5)}
                        className="px-3 py-2 bg-green-400 hover:bg-green-500 text-white font-semibold transition"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleIncreaseScore(team.id, 1)}
                        className="px-3 py-2 bg-green-300 hover:bg-green-400 text-white font-semibold transition"
                      >
                        +1
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecreaseScore(team.id, 10)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleDecreaseScore(team.id, 5)}
                        className="px-3 py-2 bg-red-400 hover:bg-red-500 text-white font-semibold transition"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleDecreaseScore(team.id, 1)}
                        className="px-3 py-2 bg-red-300 hover:bg-red-400 text-white font-semibold transition"
                      >
                        -1
                      </button>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-3 text-red-500 hover:bg-red-50 border border-line hover:border-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 안내 */}
        {teams.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted">
              ⚠️ 이 페이지는 새로고침 시 모든 데이터가 초기화됩니다
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
