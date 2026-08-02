"use client";

import { useEffect, useState } from "react";

interface Award {
  id: string;
  name: string;
  studentName: string;
  color: string;
}

function PresentationContent() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [bgmUrl, setBgmUrl] = useState("");
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [stage, setStage] = useState<"main" | "drumroll" | "reveal">("main");
  const [drumrollAudio] = useState(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/drumroll.mp3");
      audio.volume = 0.6;
      return audio;
    }
    return null;
  });

  useEffect(() => {
    // localStorage에서 데이터 가져오기
    try {
      const ceremonyAwards = localStorage.getItem("ceremonyAwards");
      const ceremonyBgm = localStorage.getItem("ceremonyBgm");

      if (ceremonyAwards) {
        const parsed = JSON.parse(ceremonyAwards);
        setAwards(parsed);
      }

      if (ceremonyBgm) {
        setBgmUrl(ceremonyBgm);
      }
    } catch (error) {
      console.error("Failed to load ceremony data:", error);
    }
  }, []);

  useEffect(() => {
    // YouTube IFrame API
    if (!bgmUrl) return;

    const videoId = extractYouTubeId(bgmUrl);
    if (!videoId) {
      console.error("Invalid YouTube URL:", bgmUrl);
      return;
    }

    console.log("Loading YouTube player with video ID:", videoId);

    // Initialize player function
    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) {
        console.error("YouTube API not loaded yet");
        return;
      }

      console.log("Creating YouTube player...");
      new (window as any).YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          loop: 1,
          playlist: videoId, // Required for loop
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log("YouTube player ready, playing...");
            event.target.playVideo();
            event.target.setVolume(30); // Set volume to 30%
          },
          onStateChange: (event: any) => {
            console.log("Player state:", event.data);
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event.data);
            if (event.data === 150 || event.data === 101) {
              alert("이 YouTube 비디오는 외부 사이트에서 재생할 수 없습니다.\n다른 비디오를 선택하거나, '공유 허용' 설정이 된 비디오를 사용해주세요.");
            }
          },
        },
      });
    };

    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      // Set callback before loading script
      (window as any).onYouTubeIframeAPIReady = initPlayer;

      // Check if script is already loading
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [bgmUrl]);

  useEffect(() => {
    if (selectedAward) {
      // Stage transitions
      setStage("drumroll");

      // Play drumroll sound effect
      if (drumrollAudio) {
        drumrollAudio.currentTime = 0;
        drumrollAudio.play().catch((error) => {
          console.error("Failed to play drumroll:", error);
        });
      }

      const timer = setTimeout(() => {
        setStage("reveal");
        // Fade out or stop drumroll
        if (drumrollAudio) {
          drumrollAudio.pause();
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
        if (drumrollAudio) {
          drumrollAudio.pause();
          drumrollAudio.currentTime = 0;
        }
      };
    }
  }, [selectedAward, drumrollAudio]);

  function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }

  function handleAwardClick(award: Award) {
    setSelectedAward(award);
  }

  function handleBackToMain() {
    setSelectedAward(null);
    setStage("main");
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* YouTube player (hidden) */}
      <div className="absolute -left-[9999px] w-0 h-0 overflow-hidden">
        <div id="youtube-player"></div>
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]"></div>
      </div>

      {/* Main: Award cards */}
      {!selectedAward && stage === "main" && (
        <div className="relative z-10 w-full max-w-6xl px-8">
          <h1 className="text-5xl md:text-7xl font-black text-white text-center mb-16 drop-shadow-2xl animate-fade-in tracking-tight">
            백호태권도 시상식
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl">
            {awards.map((award, index) => {
              // 카드 색상 가져오기 및 변환
              const colorPalette = [
                "#4A7CC7", "#F5A942", "#E67843", "#4CAF5E", "#9B59F7", "#EC4899"
              ];
              let cardColor = award.color || colorPalette[0];

              // 이전 클래스 형식이면 hex 코드로 변환
              if (cardColor.startsWith("bg-") || cardColor.startsWith("from-")) {
                cardColor = colorPalette[index % colorPalette.length];
              }

              // 더 다양한 기울임 각도
              const rotations = [-8, 5, -4, 7, -6, 3, -5, 8, -3];
              const rotation = rotations[index % rotations.length];

              console.log("Award:", award.name, "Color:", cardColor);

              return (
                <button
                  key={award.id}
                  onClick={() => handleAwardClick(award)}
                  className="award-card relative rounded-3xl p-12 shadow-2xl transition-all duration-300 cursor-pointer animate-slide-in flex items-center justify-center min-h-[280px]"
                  style={{
                    backgroundColor: cardColor,
                    animationDelay: `${index * 0.1}s`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <h3 className="text-3xl md:text-4xl font-black text-black text-center leading-tight">
                    {award.name}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Presentation: Drumroll */}
      {selectedAward && stage === "drumroll" && (
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl animate-bounce-slow">
            {selectedAward.name}
          </h2>
          <div className="text-4xl md:text-6xl font-black text-yellow-300 animate-pulse">
            🥁 두구두구두구... 🥁
          </div>
          <div className="mt-8 flex justify-center gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Presentation: Student reveal */}
      {selectedAward && stage === "reveal" && (
        <div className="text-center animate-zoom-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-6 drop-shadow-2xl">
            {selectedAward.name}
          </h2>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-300 blur-3xl animate-pulse" />
            <h1 className="relative text-8xl md:text-[12rem] font-black text-yellow-300 drop-shadow-2xl animate-bounce-once">
              {selectedAward.studentName}
            </h1>
          </div>
          <div className="mt-8 text-4xl md:text-5xl animate-bounce-slow">
            🎉 🎊 👏 🎊 🎉
          </div>
          <button
            onClick={handleBackToMain}
            className="mt-12 px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold text-lg rounded-lg transition backdrop-blur-sm"
          >
            돌아가기
          </button>
        </div>
      )}

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
            transform: translateY(30px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes bounce-once {
          0% {
            transform: scale(0) rotate(-180deg);
          }
          60% {
            transform: scale(1.2) rotate(10deg);
          }
          80% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.6s ease-out backwards;
        }
        .animate-zoom-in {
          animation: zoom-in 0.8s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-bounce-once {
          animation: bounce-once 1s ease-out;
        }
        .award-card:hover {
          transform: translateY(-10px) scale(1.05) !important;
        }
      `}</style>
    </div>
  );
}

export default function AwardsPresentationPage() {
  return <PresentationContent />;
}
