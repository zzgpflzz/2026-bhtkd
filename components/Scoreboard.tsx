"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Play } from "lucide-react";

interface Team {
  id: string;
  name: string;
  color: string;
}

const TEAM_COLORS = [
  "#0074EC", // 블루
  "#00AE24", // 그린
  "#FF5100", // 오렌지
  "#B84EFF", // 퍼플
];

export default function Scoreboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("scoreboardTeams");
    if (saved) {
      setTeams(JSON.parse(saved));
    }
  }, []);

  function saveTeams(newTeams: Team[]) {
    setTeams(newTeams);
    localStorage.setItem("scoreboardTeams", JSON.stringify(newTeams));
  }

  function handleAddTeam(team: Omit<Team, "id" | "color">) {
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
      color: TEAM_COLORS[teams.length % TEAM_COLORS.length],
    };
    saveTeams([...teams, newTeam]);
    setShowAddModal(false);
  }

  function handleUpdateTeam(team: Team) {
    saveTeams(teams.map((t) => (t.id === team.id ? team : t)));
    setEditingTeam(null);
  }

  function handleDeleteTeam(id: string) {
    if (confirm("이 팀을 삭제하시겠습니까?")) {
      saveTeams(teams.filter((t) => t.id !== id));
    }
  }

  function handleOpenScoreboard() {
    if (teams.length < 2) {
      alert("최소 2개 이상의 팀을 추가해주세요.");
      return;
    }
    // localStorage를 통해 데이터 전달
    localStorage.setItem("scoreboardTeamsActive", JSON.stringify(teams));
    const scoreboardUrl = "/scoreboard";
    window.open(scoreboardUrl, "_blank", "fullscreen=yes,width=1920,height=1080");
  }

  const canAddMoreTeams = teams.length < 4;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-2">점수기록판</h1>
        <p className="text-sm text-muted">
          팀을 등록하고 점수판을 시작하세요. (최소 2팀, 최대 4팀)
        </p>
      </div>

      {/* 팀 추가 및 점수판 열기 버튼 */}
      <div className="mb-6 flex gap-3">
        {canAddMoreTeams && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-point hover:bg-point-dark text-white transition"
          >
            <Plus size={18} />
            팀 추가하기
          </button>
        )}
        {teams.length >= 2 && (
          <button
            onClick={handleOpenScoreboard}
            className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink/85 text-white transition"
          >
            <Play size={18} />
            점수판 열기
          </button>
        )}
      </div>

      {/* 팀 리스트 테이블 */}
      {teams.length === 0 ? (
        <div className="border border-line p-12 text-center text-muted">
          등록된 팀이 없습니다. 팀 추가하기 버튼을 눌러 시작하세요.
        </div>
      ) : (
        <div className="border border-line">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">
                  팀 색상
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">
                  팀 이름
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-ink">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-line last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: team.color }}
                    ></div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingTeam(team)}
                        className="p-2 text-ink-soft hover:text-ink hover:bg-line-soft transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 팀 추가/수정 모달 */}
      {(showAddModal || editingTeam) && (
        <TeamModal
          team={editingTeam}
          onSave={editingTeam ? handleUpdateTeam : handleAddTeam}
          onClose={() => {
            setShowAddModal(false);
            setEditingTeam(null);
          }}
        />
      )}
    </div>
  );
}

interface TeamModalProps {
  team?: Team | null;
  onSave: (team: any) => void;
  onClose: () => void;
}

function TeamModal({ team, onSave, onClose }: TeamModalProps) {
  const [name, setName] = useState(team?.name || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("팀 이름을 입력해주세요.");
      return;
    }
    if (team) {
      onSave({ ...team, name });
    } else {
      onSave({ name });
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {team ? "팀 수정" : "팀 추가"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">팀 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 백호팀"
              className="form-input w-full"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-line text-muted hover:border-ink hover:text-ink transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-point hover:bg-point-dark text-white transition"
            >
              {team ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
