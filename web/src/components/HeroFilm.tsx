"use client";

import { useRef, useState } from "react";

const FILMS = [
  {
    id: "cleaner",
    src: "/films/tra-cleaner.mp4",
    label: "Cleaner",
    length: "0:48",
    caption: "The sample extract, cleaned.",
  },
  {
    id: "equity",
    src: "/films/tra-equity.mp4",
    label: "Equity + Merit",
    length: "0:44",
    caption: "Midpoint, expected placement, then the pool.",
  },
  {
    id: "closer",
    src: "/films/tra-closer.mp4",
    label: "Closer",
    length: "0:34",
    caption: "Base, bonus, and LTI as a four-year total.",
  },
] as const;

export function HeroFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const film = FILMS[active];

  function choose(index: number) {
    setActive(index);
    setPlaying(false);
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.load();
  }

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    setPlaying(true);
    try {
      await video.play();
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="mx-auto mt-10 w-full min-w-0 max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl bg-[#12151c] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <video
          key={film.src}
          ref={videoRef}
          className="aspect-video w-full bg-[#12151c]"
          src={film.src}
          controls={playing}
          preload="metadata"
          playsInline
          onPlay={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <button
            type="button"
            onClick={() => void play()}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/35"
            aria-label={`Play ${film.label}, ${film.length}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember text-white shadow-[0_0_0_12px_rgba(196,92,38,0.18)]">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-xs text-white/90">
          <span>{film.caption}</span>
          <span className="rounded bg-black/70 px-1.5 py-0.5 tabular-nums">{film.length}</span>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap justify-center gap-2">
        {FILMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(index)}
            className={
              index === active
                ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
            }
            aria-pressed={index === active}
          >
            {item.label}
            <span className={`ml-1.5 tabular-nums ${index === active ? "text-white/70" : "text-slate-400"}`}>
              {item.length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
