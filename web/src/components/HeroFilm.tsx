"use client";

import { useRef, useState } from "react";

const FILMS = [
  {
    id: "hero",
    src: "/films/tra-hero.mp4",
    poster: "/films/tra-hero.jpg",
    label: "Tour",
    length: "1:34",
    caption: "Every door, tool, and invoice on the public pages.",
  },
  {
    id: "cleaner",
    src: "/films/tra-cleaner.mp4",
    poster: "/films/tra-cleaner.jpg",
    label: "Cleaner",
    length: "0:48",
    caption: "The sample extract, cleaned.",
  },
  {
    id: "equity",
    src: "/films/tra-equity.mp4",
    poster: "/films/tra-equity.jpg",
    label: "Equity + Merit",
    length: "0:44",
    caption: "Midpoint, expected placement, then the pool.",
  },
  {
    id: "closer",
    src: "/films/tra-closer.mp4",
    poster: "/films/tra-closer.jpg",
    label: "Closer",
    length: "0:34",
    caption: "Base, bonus, and LTI as a four-year total.",
  },
  {
    id: "tally",
    src: "/films/tra-tally.mp4",
    poster: "/films/tra-tally.jpg",
    label: "Resume tally",
    length: "0:57",
    caption: "Six credit years from nine on the calendar. It lives on Closer.",
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
          preload="none"
          playsInline
          onPlaying={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <button
            type="button"
            onClick={() => void play()}
            className="absolute inset-0"
            aria-label={`Play ${film.label}, ${film.length}`}
          >
            <img
              src={film.poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <span className="absolute inset-0 bg-slate-950/20" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ember text-white shadow-[0_0_0_12px_rgba(196,92,38,0.22)]">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 py-3 text-left text-xs text-white/95">
              <span>{film.caption}</span>
              <span className="rounded bg-black/70 px-1.5 py-0.5 tabular-nums">{film.length}</span>
            </span>
          </button>
        )}
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
