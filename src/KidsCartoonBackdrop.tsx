/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface CartoonPicItem {
  id: string;
  title: string;
  caption: string;
  bgClass: string;
  cheerMessage: string;
  renderSvg: () => React.ReactNode;
}

export const CARTOON_PICTURE_GALLERY: CartoonPicItem[] = [
  {
    id: "rocket_ship",
    title: "Super Space Rocket",
    caption: "Blast Off Polite Words!",
    bgClass: "bg-sky-200",
    cheerMessage:
      "🚀 3-2-1 BLAST OFF! Your polite message is zooming straight to outer space!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        {/* Stars */}
        <circle cx="14" cy="18" r="2.5" fill="#FACC15" />
        <circle cx="68" cy="24" r="3" fill="#FACC15" />
        <circle cx="16" cy="62" r="2" fill="#F472B6" />
        {/* Rocket Flame */}
        <polygon
          points="32,58 40,74 48,58"
          fill="#F97316"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon points="36,58 40,68 44,58" fill="#FACC15" />
        {/* Rocket Fins */}
        <polygon
          points="26,46 16,60 28,58"
          fill="#EF4444"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon
          points="54,46 64,60 52,58"
          fill="#EF4444"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Rocket Body */}
        <path
          d="M40 10 C52 22 54 42 52 58 L28 58 C26 42 28 22 40 10 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        {/* Rocket Nose */}
        <path
          d="M40 10 C46 16 49 23 50 28 L30 28 C31 23 34 16 40 10 Z"
          fill="#EF4444"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        {/* Cute Window Face */}
        <circle
          cx="40"
          cy="41"
          r="9"
          fill="#38BDF8"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="37" cy="39" r="1.8" fill="#0F172A" />
        <circle cx="43" cy="39" r="1.8" fill="#0F172A" />
        <path
          d="M36.5 43.5 Q40 46.5 43.5 43.5"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "happy_school_bus",
    title: "Happy School Bus",
    caption: "Beep Beep! Ready to Learn!",
    bgClass: "bg-amber-200",
    cheerMessage:
      "🚌 BEEP BEEP! Hop on the Kindness Bus—your teacher is going to love your message!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        {/* Bus Body */}
        <rect
          x="10"
          y="24"
          width="60"
          height="34"
          rx="8"
          fill="#FACC15"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        {/* Red Stripe */}
        <line
          x1="12"
          y1="46"
          x2="68"
          y2="46"
          stroke="#EF4444"
          strokeWidth="3"
        />
        {/* Bus Windows */}
        <rect
          x="16"
          y="30"
          width="12"
          height="11"
          rx="2"
          fill="#BAE6FD"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <rect
          x="32"
          y="30"
          width="12"
          height="11"
          rx="2"
          fill="#BAE6FD"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <rect
          x="48"
          y="30"
          width="16"
          height="12"
          rx="2"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Cute Eyes & Smile on Front */}
        <circle cx="54" cy="35" r="2" fill="#0F172A" />
        <circle cx="60" cy="35" r="2" fill="#0F172A" />
        <path
          d="M54 39 Q57 41.5 60 39"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Wheels */}
        <circle
          cx="24"
          cy="58"
          r="7"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="24" cy="58" r="2.5" fill="#F8FAFC" />
        <circle
          cx="56"
          cy="58"
          r="7"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="56" cy="58" r="2.5" fill="#F8FAFC" />
      </svg>
    ),
  },
  {
    id: "dino_reader",
    title: "Rex the Reading Dino",
    caption: " asking Questions is Cool!",
    bgClass: "bg-emerald-200",
    cheerMessage:
      "🦖 ROAR-SOME! Rex the Reading Dino says asking questions makes your brain grow super strong!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        {/* Dino Tail & Spikes */}
        <polygon points="20,22 26,14 28,24" fill="#F97316" />
        <polygon points="18,34 24,26 26,36" fill="#F97316" />
        <polygon points="18,46 24,38 26,48" fill="#F97316" />
        {/* Dino Head & Body */}
        <rect
          x="24"
          y="16"
          width="34"
          height="26"
          rx="10"
          fill="#4ADE80"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <rect
          x="22"
          y="38"
          width="28"
          height="28"
          rx="8"
          fill="#4ADE80"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        {/* Dino Belly */}
        <ellipse cx="36" cy="52" rx="8" ry="10" fill="#FEF08A" />
        {/* Cute Glasses & Eye */}
        <circle
          cx="44"
          cy="26"
          r="5.5"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="45" cy="26" r="2.5" fill="#0F172A" />
        {/* Big Dino Smile */}
        <path
          d="M40 35 Q48 39 54 34"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Open Book in Paws */}
        <rect
          x="42"
          y="46"
          width="22"
          height="15"
          rx="2"
          fill="#38BDF8"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <line
          x1="53"
          y1="46"
          x2="53"
          y2="61"
          stroke="#0F172A"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "rainbow_cloud",
    title: "Sunny Rainbow Cloud",
    caption: "Kind Words Make Rainbows!",
    bgClass: "bg-pink-200",
    cheerMessage:
      "🌈 Kind words are like sunshine after the rain! You're doing amazing!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        {/* Rainbow Arcs */}
        <path
          d="M14 52 A26 26 0 0 1 66 52"
          fill="none"
          stroke="#EF4444"
          strokeWidth="5"
        />
        <path
          d="M19 52 A21 21 0 0 1 61 52"
          fill="none"
          stroke="#FACC15"
          strokeWidth="5"
        />
        <path
          d="M24 52 A16 16 0 0 1 56 52"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="5"
        />
        {/* Fluffy Cloud with Happy Face */}
        <path
          d="M18 58 C12 58 10 50 15 46 C16 39 25 38 29 43 C33 36 46 36 50 43 C56 39 64 42 64 49 C69 52 67 58 60 58 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="34" cy="49" r="2.2" fill="#0F172A" />
        <circle cx="46" cy="49" r="2.2" fill="#0F172A" />
        <circle cx="30" cy="52" r="2.5" fill="#F472B6" />
        <circle cx="50" cy="52" r="2.5" fill="#F472B6" />
        <path
          d="M36 52 Q40 55.5 44 52"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "captain_pencil_fly",
    title: "Captain Pencil Hero",
    caption: "No Spelling Worries!",
    bgClass: "bg-purple-200",
    cheerMessage:
      "✏️ Captain Pencil says: Never worry about messy first drafts—heroes always practice!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <path
          d="M18 42 L8 64 L32 56 Z"
          fill="#EF4444"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect
          x="28"
          y="20"
          width="24"
          height="36"
          rx="4"
          fill="#FACC15"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <rect
          x="28"
          y="10"
          width="24"
          height="11"
          rx="4"
          fill="#F472B6"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <polygon
          points="28,56 52,56 40,70"
          fill="#FDE68A"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon points="36,64 44,64 40,70" fill="#0F172A" />
        <circle cx="35" cy="35" r="3" fill="#0F172A" />
        <circle cx="45" cy="35" r="3" fill="#0F172A" />
        <path
          d="M34 43 Q40 49 46 43"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "cool_sun_star",
    title: "Sunny Gold Star",
    caption: "You're a Polite Superstar!",
    bgClass: "bg-orange-200",
    cheerMessage:
      "⭐ SHINE BRIGHT! Every polite message you write makes you a Communication Superstar!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <polygon
          points="40,10 49,28 69,31 54,45 58,65 40,55 22,65 26,45 11,31 31,28"
          fill="#FACC15"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Cool Cartoon Eyes & Smile */}
        <circle cx="34" cy="36" r="3" fill="#0F172A" />
        <circle cx="46" cy="36" r="3" fill="#0F172A" />
        <circle cx="33" cy="35" r="1" fill="#FFFFFF" />
        <circle cx="45" cy="35" r="1" fill="#FFFFFF" />
        <path
          d="M34 44 Q40 49 46 44"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "robo_friend",
    title: "Bibo Space Bot",
    caption: "Ask Me Any Hard Word!",
    bgClass: "bg-teal-200",
    cheerMessage:
      "🤖 BEEP-BOOP! I'm Bibo! Tap any tricky word and I'll explain it like a fun cartoon story!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <line
          x1="40"
          y1="10"
          x2="40"
          y2="22"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <circle
          cx="40"
          cy="10"
          r="5"
          fill="#FACC15"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <rect
          x="18"
          y="22"
          width="44"
          height="38"
          rx="10"
          fill="#2DD4BF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <rect
          x="24"
          y="29"
          width="32"
          height="18"
          rx="5"
          fill="#0F172A"
        />
        <circle cx="33" cy="38" r="4" fill="#38BDF8" />
        <circle cx="47" cy="38" r="4" fill="#38BDF8" />
        <path
          d="M33 52 Q40 57 47 52"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "professor_hoot_owl",
    title: "Professor Hoot",
    caption: "Wise School Helper!",
    bgClass: "bg-indigo-200",
    cheerMessage:
      "🦉 Hoot-Hoot! Teachers love when you tell them which worksheet or question you tried!",
    renderSvg: () => (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <ellipse
          cx="40"
          cy="45"
          rx="20"
          ry="21"
          fill="#8B5CF6"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <ellipse
          cx="40"
          cy="51"
          rx="12"
          ry="11"
          fill="#EDE9FE"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="37"
          r="7"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle
          cx="48"
          cy="37"
          r="7"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
        <circle cx="32" cy="37" r="3" fill="#0F172A" />
        <circle cx="48" cy="37" r="3" fill="#0F172A" />
        <polygon
          points="37,42 43,42 40,48"
          fill="#F97316"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <polygon points="20,22 40,14 60,22 40,29" fill="#0F172A" />
      </svg>
    ),
  },
];

/**
 * Full-screen fixed scrolling cartoon pictures background layer for Kids Mode
 */
export const KidsCartoonBackdrop: React.FC = () => {
  // Duplicate array for seamless infinite 0 -> -50% marquee loop
  const doubledGallery = [...CARTOON_PICTURE_GALLERY, ...CARTOON_PICTURE_GALLERY];
  const reversedGallery = [
    ...CARTOON_PICTURE_GALLERY.slice().reverse(),
    ...CARTOON_PICTURE_GALLERY.slice().reverse(),
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-85"
    >
      {/* Sunny Sky + Playful Polka Dot Cartoon Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/80 via-amber-100/80 to-pink-200/75" />

      {/* 4 Parallax Horizontal Lanes of Scrolling Cartoon Picture Cards in the Backside */}
      <div className="relative w-full h-full flex flex-col justify-around py-6 gap-6">
        {/* Lane 1: Scrolling Left */}
        <div className="animate-cartoon-scroll-left gap-6 px-3">
          {doubledGallery.map((pic, index) => (
            <div
              key={`lane1-${pic.id}-${index}`}
              className={`w-44 shrink-0 rounded-3xl ${pic.bgClass} border-3 border-slate-900/80 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.75)] p-3 flex items-center gap-3 -rotate-2`}
            >
              <div className="shrink-0 bg-white/90 rounded-2xl border-2 border-slate-900 p-1">
                {pic.renderSvg()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-950 truncate">
                  {pic.title}
                </p>
                <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">
                  {pic.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lane 2: Scrolling Right */}
        <div className="animate-cartoon-scroll-right gap-6 px-3">
          {reversedGallery.map((pic, index) => (
            <div
              key={`lane2-${pic.id}-${index}`}
              className={`w-44 shrink-0 rounded-3xl ${pic.bgClass} border-3 border-slate-900/80 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.75)] p-3 flex items-center gap-3 rotate-2`}
            >
              <div className="shrink-0 bg-white/90 rounded-2xl border-2 border-slate-900 p-1">
                {pic.renderSvg()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-950 truncate">
                  {pic.title}
                </p>
                <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">
                  {pic.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lane 3: Scrolling Left */}
        <div className="animate-cartoon-scroll-left gap-6 px-3">
          {doubledGallery.map((pic, index) => (
            <div
              key={`lane3-${pic.id}-${index}`}
              className={`w-44 shrink-0 rounded-3xl ${pic.bgClass} border-3 border-slate-900/80 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.75)] p-3 flex items-center gap-3 -rotate-1`}
            >
              <div className="shrink-0 bg-white/90 rounded-2xl border-2 border-slate-900 p-1">
                {pic.renderSvg()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-950 truncate">
                  {pic.title}
                </p>
                <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">
                  {pic.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lane 4: Scrolling Right */}
        <div className="animate-cartoon-scroll-right gap-6 px-3">
          {reversedGallery.map((pic, index) => (
            <div
              key={`lane4-${pic.id}-${index}`}
              className={`w-44 shrink-0 rounded-3xl ${pic.bgClass} border-3 border-slate-900/80 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.75)] p-3 flex items-center gap-3 rotate-1`}
            >
              <div className="shrink-0 bg-white/90 rounded-2xl border-2 border-slate-900 p-1">
                {pic.renderSvg()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-950 truncate">
                  {pic.title}
                </p>
                <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">
                  {pic.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Interactive Scrolling Cartoon Picture Parade Strip inside the Kids Clubhouse
 * so kids can see and tap the scrolling cartoon pictures right inside the workspace!
 */
export const KidsCartoonParadeStrip: React.FC<{
  onTapCartoonCard: (cheer: string) => void;
}> = ({ onTapCartoonCard }) => {
  const doubledGallery = [...CARTOON_PICTURE_GALLERY, ...CARTOON_PICTURE_GALLERY];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-300/90 via-amber-200/90 to-pink-300/90 border-3 border-slate-900 py-3 shadow-[4px_4px_0px_0px_#0f172a]">
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-950 bg-white/90 px-2.5 py-0.5 rounded-full border-2 border-slate-900">
          🎠 Live Cartoon Parade! (Tap Any Moving Picture for +1 Gold Star ⭐)
        </span>
        <span className="text-[11px] font-extrabold text-slate-900 hidden sm:inline">
          Scrolling Cartoon Friends ➔
        </span>
      </div>

      <div className="animate-cartoon-scroll-fast gap-4 px-4">
        {doubledGallery.map((pic, index) => (
          <button
            key={`parade-${pic.id}-${index}`}
            type="button"
            onClick={() => onTapCartoonCard(pic.cheerMessage)}
            className={`w-48 shrink-0 rounded-2xl ${pic.bgClass} hover:scale-105 transition-transform border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] p-2.5 flex items-center gap-2.5 text-left cursor-pointer`}
          >
            <div className="shrink-0 bg-white rounded-xl border-2 border-slate-900 p-1">
              {pic.renderSvg()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-950 truncate">
                {pic.title}
              </p>
              <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">
                {pic.caption}
              </p>
              <span className="inline-block mt-1 text-[9px] font-extrabold bg-white/90 px-1.5 py-0.5 rounded border border-slate-900 text-pink-600">
                Tap Me! ⭐
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
