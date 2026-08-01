"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PresentationContent() {
  const searchParams = useSearchParams();
  const awardName = searchParams.get("name") || "";
  const studentName = searchParams.get("student") || "";
  const bgmUrl = searchParams.get("bgm") || "";

  const [stage, setStage] = useState<"award" | "drumroll" | "reveal">("award");

  useEffect(() => {
    // Stage transitions
    const timer1 = setTimeout(() => setStage("drumroll"), 2000);
    const timer2 = setTimeout(() => setStage("reveal"), 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    // YouTube IFrame API
    if (!bgmUrl) return;

    const videoId = extractYouTubeId(bgmUrl);
    if (!videoId) return;

    // Load YouTube API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      new (window as any).YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
          },
        },
      });
    };
  }, [bgmUrl]);

  function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center overflow-hidden">
      {/* YouTube player (hidden) */}
      {bgmUrl && (
        <div className="hidden">
          <div id="youtube-player"></div>
        </div>
      )}

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

      {/* Stage 1: Award name */}
      {stage === "award" && (
        <div className="text-center animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-2xl animate-scale-in">
            {awardName}
          </h1>
          <div className="text-2xl md:text-3xl text-white/80 animate-pulse">
            ✨ ✨ ✨
          </div>
        </div>
      )}

      {/* Stage 2: Drumroll */}
      {stage === "drumroll" && (
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl animate-bounce-slow">
            {awardName}
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

      {/* Stage 3: Student reveal */}
      {stage === "reveal" && (
        <div className="text-center animate-zoom-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-6 drop-shadow-2xl">
            {awardName}
          </h2>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-300 blur-3xl animate-pulse" />
            <h1 className="relative text-8xl md:text-[12rem] font-black text-yellow-300 drop-shadow-2xl animate-bounce-once">
              {studentName}
            </h1>
          </div>
          <div className="mt-8 text-4xl md:text-5xl animate-bounce-slow">
            🎉 🎊 👏 🎊 🎉
          </div>
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
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
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
        .animate-scale-in {
          animation: scale-in 1s ease-out;
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
