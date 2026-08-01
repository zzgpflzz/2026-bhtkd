"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Play, Music } from "lucide-react";

interface Award {
  id: string;
  name: string;
  studentName: string;
  color: string;
}

const CARD_COLORS = [
  "bg-pink-100 border-pink-300",
  "bg-blue-100 border-blue-300",
  "bg-yellow-100 border-yellow-300",
  "bg-green-100 border-green-300",
  "bg-purple-100 border-purple-300",
  "bg-orange-100 border-orange-300",
];

export default function AwardsCeremony() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [bgmUrl, setBgmUrl] = useState("");

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("awards");
    if (saved) {
      setAwards(JSON.parse(saved));
    }
    const savedBgm = localStorage.getItem("awardsBgm");
    if (savedBgm) {
      setBgmUrl(savedBgm);
    }
  }, []);

  function saveAwards(newAwards: Award[]) {
    setAwards(newAwards);
    localStorage.setItem("awards", JSON.stringify(newAwards));
  }

  function saveBgm(url: string) {
    setBgmUrl(url);
    localStorage.setItem("awardsBgm", url);
  }

  function handleAddAward(award: Omit<Award, "id" | "color">) {
    const newAward: Award = {
      ...award,
      id: `award-${Date.now()}`,
      color: CARD_COLORS[awards.length % CARD_COLORS.length],
    };
    saveAwards([...awards, newAward]);
    setShowAddModal(false);
  }

  function handleUpdateAward(award: Award) {
    saveAwards(awards.map((a) => (a.id === award.id ? award : a)));
    setEditingAward(null);
  }

  function handleDeleteAward(id: string) {
    if (confirm("이 상을 삭제하시겠습니까?")) {
      saveAwards(awards.filter((a) => a.id !== id));
    }
  }

  function handleOpenCeremonyPage() {
    const awardsData = encodeURIComponent(JSON.stringify(awards));
    const presentationUrl = `/awards-presentation?awards=${awardsData}&bgm=${encodeURIComponent(bgmUrl)}`;
    window.open(presentationUrl, "_blank", "fullscreen=yes,width=1920,height=1080");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-2">시상식</h1>
        <p className="text-sm text-muted">
          상과 수상자를 등록하고 프레젠테이션을 진행하세요.
        </p>
      </div>

      {/* BGM 설정 */}
      <div className="mb-6 p-4 border border-line bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Music size={18} className="text-muted" />
          <label className="text-sm font-medium text-ink">배경음악 (YouTube URL)</label>
        </div>
        <input
          type="text"
          value={bgmUrl}
          onChange={(e) => saveBgm(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="form-input w-full"
        />
        <p className="text-xs text-muted mt-1">
          YouTube 동영상 URL을 입력하면 프레젠테이션에서 배경음악으로 재생됩니다.
        </p>
      </div>

      {/* 상 추가 및 시상식 페이지 버튼 */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-point hover:bg-point-dark text-white transition"
        >
          <Plus size={18} />
          상 추가하기
        </button>
        {awards.length > 0 && (
          <button
            onClick={handleOpenCeremonyPage}
            className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink-soft text-white transition"
          >
            <Play size={18} />
            시상식 페이지 확인
          </button>
        )}
      </div>

      {/* 상 리스트 테이블 */}
      {awards.length === 0 ? (
        <div className="border border-line p-12 text-center text-muted">
          등록된 상이 없습니다. 상 추가하기 버튼을 눌러 시작하세요.
        </div>
      ) : (
        <div className="border border-line">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">
                  상 이름
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">
                  수상자
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-ink">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {awards.map((award) => (
                <tr key={award.id} className="border-b border-line last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-ink">
                    {award.name}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {award.studentName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingAward(award)}
                        className="p-2 text-ink-soft hover:text-ink hover:bg-line-soft transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAward(award.id)}
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

      {/* 상 추가/수정 모달 */}
      {(showAddModal || editingAward) && (
        <AwardModal
          award={editingAward}
          onSave={editingAward ? handleUpdateAward : handleAddAward}
          onClose={() => {
            setShowAddModal(false);
            setEditingAward(null);
          }}
        />
      )}
    </div>
  );
}

interface AwardModalProps {
  award?: Award | null;
  onSave: (award: any) => void;
  onClose: () => void;
}

function AwardModal({ award, onSave, onClose }: AwardModalProps) {
  const [name, setName] = useState(award?.name || "");
  const [studentName, setStudentName] = useState(award?.studentName || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !studentName.trim()) {
      alert("상 이름과 수상자 이름을 모두 입력해주세요.");
      return;
    }
    if (award) {
      onSave({ ...award, name, studentName });
    } else {
      onSave({ name, studentName });
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {award ? "상 수정" : "상 추가"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">상 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 이달의 출석왕"
              className="form-input w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">수상자</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="예) 김태권"
              className="form-input w-full"
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
              {award ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
