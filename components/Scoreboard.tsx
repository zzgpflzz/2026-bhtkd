"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

export default function Scoreboard() {
  const handleOpenScoreboard = () => {
    const scoreboardUrl = "/scoreboard";
    window.open(scoreboardUrl, "_blank", "width=1200,height=800");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-2">점수기록판</h1>
        <p className="text-sm text-muted">
          팀별 점수를 기록하고 관리하세요. 새 창에서 점수판이 열립니다.
        </p>
      </div>

      <div className="border border-line p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 bg-line-soft rounded-full flex items-center justify-center mx-auto">
            <ExternalLink size={32} className="text-ink-soft" />
          </div>
          <h2 className="text-lg font-semibold text-ink">
            팀 점수 기록 시작하기
          </h2>
          <p className="text-sm text-muted">
            버튼을 클릭하면 새 창에서 점수기록판이 열립니다.
            <br />
            팀 이름과 점수를 자유롭게 기록할 수 있으며,
            <br />
            새로고침 시 데이터는 초기화됩니다.
          </p>
          <button
            onClick={handleOpenScoreboard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-point hover:bg-point-dark text-white font-semibold transition"
          >
            <ExternalLink size={18} />
            점수기록판 열기
          </button>
        </div>
      </div>
    </div>
  );
}
