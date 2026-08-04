"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Play } from "lucide-react";

interface Team {
  id: string;
  name: string;
  color: string;
}

const TEAM_COLORS_2 = [
  "#FF0044", // 메인 레드
  "#007AFF", // 블루
];

const TEAM_COLORS_4 = [
  "#0074EC", // 블루
  "#00AE24", // 그린
  "#FF5100", // 오렌지
  "#B84EFF", // 퍼플
];

export default function Scoreboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [title, setTitle] = useState("SCOREBOARD");

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("scoreboardTeams");
    if (saved) {
      setTeams(JSON.parse(saved));
    }
    const savedTitle = localStorage.getItem("scoreboardTitle");
    if (savedTitle) {
      setTitle(savedTitle);
    }
  }, []);

  function saveTeams(newTeams: Team[]) {
    setTeams(newTeams);
    localStorage.setItem("scoreboardTeams", JSON.stringify(newTeams));
  }

  function saveTitle(newTitle: string) {
    setTitle(newTitle);
    localStorage.setItem("scoreboardTitle", newTitle);
  }

  function handleAddTeam(team: Omit<Team, "id" | "color">) {
    const colors = teams.length < 2 ? TEAM_COLORS_2 : TEAM_COLORS_4;
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
      color: colors[teams.length % colors.length],
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
    localStorage.setItem("scoreboardTitleActive", title);
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

      {/* 타이틀 설정 */}
      <div className="mb-6 border border-line p-4 bg-white">
        <label className="block text-sm font-medium text-ink mb-2">
          점수판 타이틀
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => saveTitle(e.target.value)}
          placeholder="SCOREBOARD"
          className="form-input w-full"
        />
        <p className="text-xs text-muted mt-1">
          점수판 상단에 표시될 타이틀을 입력하세요
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

  const teamNames = [
    // 멋진 이름들
    "백호", "청룡", "주작", "현무",
    "용맹", "승리", "강철", "불꽃",
    "번개", "천둥", "태풍", "폭풍",
    "맹호", "독수리", "사자", "표범",
    "전사", "용사", "영웅", "투사",
    "화랑", "무사", "기사", "장군",
    "혜성", "유성", "별빛", "태양",
    "달빛", "은하", "우주", "행성",
    // 귀여운/웃긴 이름들
    "바보", "똥개", "멍멍", "야옹",
    "뚱이", "삐약", "꼬꼬", "꾸러기",
    "깜찍", "앙증", "귀요미", "토실",
    "동글", "통통", "꼬마", "쪼꼬미",
    "방울", "콩알", "햄찌", "복슬",
    "폭신", "말랑", "쫀득", "몽글",
    "두부", "만두", "떡볶이", "김밥",
    "호빵", "붕어빵", "약과", "꿀떡",
  ];

  function handleRandomName() {
    const randomName = teamNames[Math.floor(Math.random() * teamNames.length)];
    setName(randomName);
  }

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
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 백호팀"
                className="form-input flex-1"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRandomName}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-sm font-medium border border-line transition"
              >
                랜덤
              </button>
            </div>
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
