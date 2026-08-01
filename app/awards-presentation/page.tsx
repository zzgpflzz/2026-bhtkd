"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Award {
  id: string;
  name: string;
  studentName: string;
  color: string;
}

function PresentationContent() {
  const searchParams = useSearchParams();
  const awardsParam = searchParams.get("awards") || "[]";
  const bgmUrl = searchParams.get("bgm") || "";

  const [awards, setAwards] = useState<Award[]>([]);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [stage, setStage] = useState<"main" | "drumroll" | "reveal">("main");

  useEffect(() => {
    try {
      const parsed = JSON.parse(decodeURIComponent(awardsParam));
      setAwards(parsed);
    } catch (error) {
      console.error("Failed to parse awards:", error);
    }
  }, [awardsParam]);

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
      const timer = setTimeout(() => setStage("reveal"), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedAward]);

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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center overflow-hidden">
      {/* YouTube player (hidden) */}
      <div className="absolute -left-[9999px] w-0 h-0 overflow-hidden">
        <div id="youtube-player"></div>
      </div>

      {/* Floating background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-16 h-16 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main: Award cards */}
      {!selectedAward && stage === "main" && (
        <div className="relative z-10 w-full max-w-6xl px-8">
          <h1 className="text-5xl md:text-6xl font-black text-white text-center mb-12 drop-shadow-2xl animate-fade-in">
            🏆 시상식 🏆
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards.map((award, index) => {
              const rotation = (index % 3 === 0 ? -2 : index % 3 === 1 ? 1 : -1);
              return (
                <button
                  key={award.id}
                  onClick={() => handleAwardClick(award)}
                  className={`${award.color} border-2 rounded-2xl p-8 shadow-2xl transition transform hover:scale-110 hover:shadow-3xl cursor-pointer animate-slide-in`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-ink text-center">
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
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(180deg);
          }
        }
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
        .animate-float {
          animation: float linear infinite;
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
      `}</style>
    </div>
  );
}

export default function AwardsPresentationPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>}>
      <PresentationContent />
    </Suspense>
  );
}
