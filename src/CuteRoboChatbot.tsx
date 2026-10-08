/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  HelpCircle,
  BookOpen,
  Sparkles,
  Volume2,
  RefreshCw,
  Compass,
} from "lucide-react";
import {
  buildRoboFallbackReply,
  SIMPLE_WORD_GLOSSARY,
  APP_FEATURES_GUIDE,
  type RoboChatResponse,
} from "./fallbackData";

interface ChatMessage {
  id: string;
  sender: "robo" | "user";
  text: string;
  wordBreakdown?: {
    word: string;
    simpleMeaning: string;
    exampleUse: string;
    kidAndSeniorTip: string;
  };
}

interface CuteRoboChatbotProps {
  persona: string;
  currentDraft: string;
  polishedEmail: string;
  externalWordTrigger?: string | null;
  onClearExternalTrigger?: () => void;
}

/**
 * Custom SVG Cute Mini-Robot Character ("Bibo")
 * Features glowing cyan eyes, a bobbing antenna bulb, friendly blushing cheeks,
 * and a cheerful waving arm.
 */
export const CuteRoboAvatar = React.memo(function CuteRoboAvatar({
  size = "md",
  isThinking = false,
}: {
  size?: "sm" | "md" | "lg";
  isThinking?: boolean;
}) {
  const dimensions =
    size === "lg" ? "w-14 h-14" : size === "md" ? "w-10 h-10" : "w-8 h-8";

  return (
    <div
      aria-hidden="true"
      className={`relative ${dimensions} shrink-0 select-none`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Antenna Stem */}
        <line
          x1="50"
          y1="8"
          x2="50"
          y2="22"
          stroke="#0F766E"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Glowing Antenna Bulb */}
        <circle
          cx="50"
          cy="8"
          r="6"
          fill={isThinking ? "#F59E0B" : "#14B8A6"}
        />
        <circle cx="48" cy="6" r="2" fill="#CCFBF1" />

        {/* Side Ear Bolts */}
        <rect x="8" y="40" width="8" height="18" rx="4" fill="#0F766E" />
        <rect x="84" y="40" width="8" height="18" rx="4" fill="#0F766E" />

        {/* Robot Head Casing */}
        <rect
          x="15"
          y="22"
          width="70"
          height="54"
          rx="20"
          fill="#F0FDFA"
          stroke="#0F766E"
          strokeWidth="4.5"
        />

        {/* Inner Dark Visor Screen */}
        <rect x="23" y="31" width="54" height="32" rx="12" fill="#0F172A" />

        {/* Cute Glowing Cyan Eyes */}
        {isThinking ? (
          <>
            <circle cx="38" cy="46" r="5.5" fill="#38BDF8" />
            <circle cx="62" cy="46" r="5.5" fill="#38BDF8" />
            <circle cx="36" cy="44" r="2" fill="#FFFFFF" />
            <circle cx="60" cy="44" r="2" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <circle cx="38" cy="45" r="6" fill="#2DD4BF" />
            <circle cx="62" cy="45" r="6" fill="#2DD4BF" />
            <circle cx="36" cy="43" r="2.2" fill="#FFFFFF" />
            <circle cx="60" cy="43" r="2.2" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <ellipse
          cx="29"
          cy="54"
          rx="4.5"
          ry="2.5"
          fill="#FB7185"
          opacity="0.85"
        />
        <ellipse
          cx="71"
          cy="54"
          rx="4.5"
          ry="2.5"
          fill="#FB7185"
          opacity="0.85"
        />

        {/* Cute Happy Smile on Visor */}
        <path
          d="M 43 53 Q 50 59 57 53"
          stroke="#2DD4BF"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Robot Torso Peek */}
        <path
          d="M 30 76 L 70 76 L 74 94 L 26 94 Z"
          fill="#CCFBF1"
          stroke="#0F766E"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Heart Badge on Chest */}
        <circle cx="50" cy="85" r="5" fill="#14B8A6" />
      </svg>
    </div>
  );
});

const CuteRoboChatbot = React.memo(function CuteRoboChatbot({
  persona,
  currentDraft,
  polishedEmail,
  externalWordTrigger,
  onClearExternalTrigger,
}: CuteRoboChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "chat" | "app_guide" | "dictionary"
  >("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "robo",
      text: "Beep-boop! Hi friend! I'm Bibo, your friendly robot helper! 🤖\n\nI can:\n• Show you **how to use this app** and explain **how every feature is useful for you**\n• Explain **difficult words** in plain, everyday language\n• Clear up any **doubts** about your message!",
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How do I use this app step-by-step?",
    "How is each feature useful for me?",
    "What does 'syllabus' mean?",
    "How does Auto-Detect Language work?",
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // If the user clicked a difficult word or feature trigger in the main UI, open Bibo and explain it immediately
  useEffect(() => {
    if (externalWordTrigger) {
      setIsOpen(true);
      if (externalWordTrigger === "__OPEN_APP_GUIDE__") {
        setActiveTab("app_guide");
      } else {
        setActiveTab("chat");
        handleSendQuestion(
          `What does "${externalWordTrigger}" mean in simple words?`
        );
      }
      if (onClearExternalTrigger) {
        onClearExternalTrigger();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalWordTrigger]);

  const handleSendQuestion = async (questionOverride?: string) => {
    const query = (
      questionOverride !== undefined ? questionOverride : inputVal
    ).trim();
    if (!query) return;

    if (questionOverride === undefined) {
      setInputVal("");
    }
    setActiveTab("chat");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    const fallback = buildRoboFallbackReply(query);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9500);

      const res = await fetch("/api/robo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          userMessage: query,
          persona,
          currentDraft,
          polishedEmail,
        }),
      });

      clearTimeout(timeoutId);

      let parsed: RoboChatResponse | null = null;
      if (res.ok) {
        const raw = await res.text();
        try {
          parsed = JSON.parse(raw) as RoboChatResponse;
        } catch (_e) {
          parsed = null;
        }
      }

      const finalData = parsed && parsed.reply ? parsed : fallback;

      setMessages((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          sender: "robo",
          text: finalData.reply,
          wordBreakdown: finalData.wordBreakdown,
        },
      ]);
      if (
        Array.isArray(finalData.suggestedFollowups) &&
        finalData.suggestedFollowups.length > 0
      ) {
        setSuggestions(finalData.suggestedFollowups.slice(0, 4));
      }
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          sender: "robo",
          text: fallback.reply,
          wordBreakdown: fallback.wordBreakdown,
        },
      ]);
      setSuggestions(fallback.suggestedFollowups);
    } finally {
      setIsSending(false);
    }
  };

  const speakRoboText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = 1.15;
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <aside
      aria-label="Bibo Robot Helper Assistant"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end"
    >
      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bibo: App Guide and Word Buddy"
          className="mb-3 w-[360px] sm:w-[410px] bg-white rounded-2xl border-2 border-teal-700 shadow-xl overflow-hidden flex flex-col"
        >
          {/* Cute Robo Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CuteRoboAvatar size="md" isThinking={isSending} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-white">
                    Bibo: App Guide &amp; Word Buddy
                  </h3>
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                  />
                </div>
                <p className="text-[11px] text-teal-200">
                  How to use features, clear doubts &amp; simple word meanings!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Bibo Robot Helper"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3-Tab Switcher inside Bibo: Ask Doubts | App Guide & Features | Hard Words */}
          <div
            role="tablist"
            aria-label="Bibo Assistant Views"
            className="grid grid-cols-3 bg-slate-100 p-1 border-b border-slate-200 text-[11px] font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "chat"}
              onClick={() => setActiveTab("chat")}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white text-teal-950 shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              <HelpCircle
                aria-hidden="true"
                className="w-3.5 h-3.5 text-teal-700 shrink-0"
              />
              <span>Ask Doubts</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "app_guide"}
              onClick={() => setActiveTab("app_guide")}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === "app_guide"
                  ? "bg-white text-teal-950 shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              <Compass
                aria-hidden="true"
                className="w-3.5 h-3.5 text-teal-700 shrink-0"
              />
              <span>App Guide</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "dictionary"}
              onClick={() => setActiveTab("dictionary")}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === "dictionary"
                  ? "bg-white text-teal-950 shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              <BookOpen
                aria-hidden="true"
                className="w-3.5 h-3.5 text-teal-700 shrink-0"
              />
              <span>Hard Words</span>
            </button>
          </div>

          {activeTab === "app_guide" ? (
            /* Interactive Feature Guide: How to Use the App & Why Each Feature Is Useful */
            <div
              role="tabpanel"
              aria-label="App Guide and Features"
              className="p-4 max-h-[380px] overflow-y-auto space-y-3 bg-slate-50"
            >
              <div className="p-3 rounded-xl bg-teal-900 text-white space-y-1">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-teal-300"
                  />
                  <span>
                    How to Use &ldquo;Say It Right&rdquo; &amp; Why It Helps You
                  </span>
                </p>
                <p className="text-[11px] text-teal-100 leading-relaxed">
                  Click any feature below to hear Bibo explain it out loud or ask
                  a follow-up question!
                </p>
              </div>

              {APP_FEATURES_GUIDE.map((feat) => (
                <div
                  key={feat.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      {feat.title}
                    </h4>
                    <button
                      type="button"
                      aria-label={`Listen to explanation for ${feat.title}`}
                      onClick={() =>
                        speakRoboText(
                          `${feat.title}. How to use: ${feat.howToUse}. Why it is useful: ${feat.whyUseful}`
                        )
                      }
                      className="text-[11px] font-semibold text-teal-800 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Volume2 aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">How to use:</strong>{" "}
                    {feat.howToUse}
                  </p>
                  <p className="text-xs text-teal-950 bg-teal-50/70 p-2 rounded-lg leading-relaxed">
                    <strong>Why it&apos;s useful for you:</strong>{" "}
                    {feat.whyUseful}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-700">
                      <strong>Best for:</strong> {feat.bestForWho}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSendQuestion(
                          `Can you tell me more about how "${feat.title}" helps me?`
                        )
                      }
                      className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                    >
                      Ask Bibo about this →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "dictionary" ? (
            /* Quick One-Tap Difficult Words Dictionary for Kids, Seniors & Students */
            <div
              role="tabpanel"
              aria-label="Hard Words Dictionary"
              className="p-4 max-h-[380px] overflow-y-auto space-y-2.5 bg-slate-50"
            >
              <p className="text-xs text-slate-700 mb-2">
                Tap any tricky word below to see what it means in plain, friendly
                language:
              </p>
              {Object.entries(SIMPLE_WORD_GLOSSARY).map(([word, details]) => (
                <div
                  key={word}
                  className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-800 uppercase">
                      {word}
                    </span>
                    <button
                      type="button"
                      aria-label={`Listen to meaning of ${word}`}
                      onClick={() =>
                        speakRoboText(`${word}. ${details.simpleMeaning}`)
                      }
                      className="text-[11px] font-semibold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Listen to word meaning"
                    >
                      <Volume2 aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    <strong>Simple Meaning:</strong> {details.simpleMeaning}
                  </p>
                  <p className="text-[11px] text-teal-950 bg-teal-50/70 px-2.5 py-1.5 rounded-lg">
                    💡 <strong>Tip:</strong> {details.kidAndSeniorTip}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* Interactive Chat Stream with Bibo */
            <div role="tabpanel" aria-label="Ask Bibo Doubts">
              <div
                role="log"
                aria-live="polite"
                className="p-3.5 max-h-[310px] overflow-y-auto space-y-3 bg-slate-50"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {msg.sender === "robo" && <CuteRoboAvatar size="sm" />}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-teal-700 text-white rounded-br-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {msg.wordBreakdown && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px] bg-teal-50/60 p-2 rounded-lg text-teal-950">
                          <p>
                            <strong>Word:</strong>{" "}
                            <span className="font-mono uppercase font-semibold">
                              {msg.wordBreakdown.word}
                            </span>
                          </p>
                          <p>
                            <strong>Simple Meaning:</strong>{" "}
                            {msg.wordBreakdown.simpleMeaning}
                          </p>
                          <p>
                            <strong>Example:</strong>{" "}
                            {msg.wordBreakdown.exampleUse}
                          </p>
                        </div>
                      )}

                      {msg.sender === "robo" && (
                        <button
                          type="button"
                          onClick={() => speakRoboText(msg.text)}
                          aria-label="Read Bibo reply aloud"
                          className="mt-1.5 text-[10px] font-semibold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 aria-hidden="true" className="w-3 h-3" />
                          <span>Read aloud</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 text-xs text-slate-700"
                  >
                    <CuteRoboAvatar size="sm" isThinking />
                    <span className="bg-white border border-slate-200 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                      <RefreshCw
                        aria-hidden="true"
                        className="w-3 h-3 animate-spin text-teal-700"
                      />
                      <span>Bibo is thinking...</span>
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Doubt & Word Chips */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendQuestion(sug)}
                    className="px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuestion();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <label htmlFor="bibo-chat-input" className="sr-only">
                  Ask Bibo a question about features or word meanings
                </label>
                <input
                  id="bibo-chat-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask how a feature works, a word meaning, or any doubt..."
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-teal-700 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputVal.trim()}
                  className="p-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white transition-colors shrink-0 cursor-pointer"
                  aria-label="Send question to Bibo"
                >
                  <Send aria-hidden="true" className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Cute Robot Launcher Button at Bottom-Right Corner */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "Close Bibo Robot Helper"
            : "Open Bibo Robot Helper: App Guide, Feature Help, and Word Meanings"
        }
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg border-2 border-teal-500 transition-all cursor-pointer"
      >
        <CuteRoboAvatar size="md" isThinking={isSending} />
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-bold tracking-tight text-white">
              {isOpen ? "Close Bibo Robo" : "Ask Bibo Robo 🤖"}
            </span>
            <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-teal-300" />
          </div>
          <span className="block text-[10px] text-teal-200">
            App Guide · Feature Help · Word Meanings
          </span>
        </div>
      </button>
    </aside>
  );
});

export default CuteRoboChatbot;
