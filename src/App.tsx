/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Send,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Download,
  RefreshCw,
  GraduationCap,
  HeartHandshake,
  Smile,
  ShieldCheck,
  CheckSquare,
  Square,
  Globe,
  Type as TypeIcon,
  MessageSquare,
  Mail,
  Hash,
  FlaskConical,
  Sparkles,
  ArrowRight,
  UserCheck,
  Save,
  RotateCcw,
  MessageCircleHeart,
  FileText,
  Moon,
  Sun,
  Keyboard,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  buildFallbackResponse,
  SIMPLE_WORD_GLOSSARY,
  detectInputLanguage,
  type EmailAnalysisResult,
  type BeforeAfterHighlight,
  type ProfessorReactions,
} from "./fallbackData";
import CuteRoboChatbot from "./CuteRoboChatbot";
import {
  KidsCartoonBackdrop,
  KidsCartoonParadeStrip,
} from "./KidsCartoonBackdrop";

export type PersonaId =
  | "college_student"
  | "seniors"
  | "school_kids"
  | "women_advocacy"
  | "friendly_chat";

export type ToneOption =
  | "Ultra Formal"
  | "Polite & Direct"
  | "Apologetic"
  | "Persuasive";

export type PlatformOption =
  | "Email"
  | "WhatsApp / Text Message"
  | "Slack / Discord";

export type OutputTextFormat =
  | "standard_paragraphs"
  | "bullet_points"
  | "numbered_steps"
  | "short_single_paragraph"
  | "formal_letter"
  | "template_placeholders";

export const OUTPUT_TEXT_FORMAT_OPTIONS: {
  id: OutputTextFormat;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: "standard_paragraphs",
    label: "📄 Standard Paragraphs",
    shortDesc: "Clean multi-paragraph message",
  },
  {
    id: "bullet_points",
    label: "• Bullet Points",
    shortDesc: "Easy-to-scan bulleted list",
  },
  {
    id: "numbered_steps",
    label: "1. Numbered Steps",
    shortDesc: "Step-by-step numbered points",
  },
  {
    id: "short_single_paragraph",
    label: "⚡ Short Single Paragraph",
    shortDesc: "Compact one-paragraph note",
  },
  {
    id: "formal_letter",
    label: "🏛️ Formal Letter Format",
    shortDesc: "Includes Date, To/From & Subject header",
  },
  {
    id: "template_placeholders",
    label: "🧩 Fill-in-the-Blank Template",
    shortDesc: "Highlights [BRACKETS] for easy reuse",
  },
];

function formatOutputText(
  rawText: string,
  format: OutputTextFormat,
  meta: {
    subjectLine: string;
    recipient: string;
    sender: string;
    courseOrRef: string;
  }
): string {
  const clean = (rawText || "").trim();
  if (!clean) return "";

  if (format === "standard_paragraphs") {
    return clean;
  }

  const lines = clean
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (format === "short_single_paragraph") {
    return lines.join(" ");
  }

  if (format === "bullet_points") {
    if (lines.length <= 2) {
      const sentences = clean
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length <= 2) return clean;
      const first = sentences[0];
      const last = sentences[sentences.length - 1];
      const middle = sentences.slice(1, -1).map((s) => `• ${s.replace(/^[•\-*]\s*/, "")}`);
      return [first, "", ...middle, "", last].join("\n");
    }
    const greeting = lines[0];
    const signOffStart = Math.max(1, lines.length - 2);
    const bodyLines = lines.slice(1, signOffStart);
    const closingLines = lines.slice(signOffStart);

    const bulletedBody: string[] = [];
    for (const paragraph of bodyLines) {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const s of sentences) {
        bulletedBody.push(`• ${s.replace(/^[•\-*]\s*/, "")}`);
      }
    }
    return [greeting, "", ...bulletedBody, "", ...closingLines].join("\n");
  }

  if (format === "numbered_steps") {
    const greeting = lines[0] || "";
    const signOffStart = Math.max(1, lines.length - 2);
    const bodyLines = lines.slice(1, signOffStart);
    const closingLines = lines.slice(signOffStart);

    const numberedBody: string[] = [];
    let counter = 1;
    for (const paragraph of bodyLines) {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const s of sentences) {
        numberedBody.push(`${counter}. ${s.replace(/^[0-9]+[.)]\s*|^[•\-*]\s*/, "")}`);
        counter++;
      }
    }
    return [greeting, "", ...numberedBody, "", ...closingLines].join("\n");
  }

  if (format === "formal_letter") {
    const todayStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return [
      `Date: ${todayStr}`,
      `To: ${meta.recipient || "Recipient"}`,
      `From: ${meta.sender || "[Your Full Name]"}`,
      `Reference / Course: ${meta.courseOrRef || "[Reference ID]"}`,
      `Subject: ${meta.subjectLine || "Formal Request"}`,
      "------------------------------------------------------------",
      "",
      clean,
    ].join("\n");
  }

  if (format === "template_placeholders") {
    return [
      `Subject: [${meta.courseOrRef || "COURSE / REF ID"}] ${meta.subjectLine || "Request"}`,
      "",
      `Dear [${meta.recipient || "Recipient Name"}],`,
      "",
      `I hope your week is going well. I am writing regarding [${meta.courseOrRef || "Course / Context"}] to share a brief update and request your guidance:`,
      "",
      clean
        .replace(/^Dear\s+[^\n]+,\s*/i, "")
        .replace(/^Hi\s+[^\n]+,\s*/i, ""),
      "",
      "Proposed Next Step: [e.g., Submit by Friday at 5:00 PM / Meet during Office Hours]",
      "Supporting Attachment: [e.g., Doctor's Note / Receipt / None]",
    ].join("\n");
  }

  return clean;
}

export type WriterMoodOption =
  | "Anxious / Stressed"
  | "Apologetic"
  | "Excited"
  | "Frustrated"
  | "Angry / Heated"
  | "Calm / Neutral"
  | "Confident";

export const WRITER_MOOD_OPTIONS: {
  value: WriterMoodOption;
  label: string;
  hint: string;
}[] = [
  {
    value: "Anxious / Stressed",
    label: "😰 Anxious / Stressed",
    hint: "Calms panic & urgency into steady accountability",
  },
  {
    value: "Apologetic",
    label: "🥺 Apologetic",
    hint: "Balances sincere remorse without over-apologizing",
  },
  {
    value: "Frustrated",
    label: "😤 Frustrated",
    hint: "Removes blame & friction while keeping your firm point",
  },
  {
    value: "Angry / Heated",
    label: "🔥 Angry / Heated",
    hint: "Activates Cool-Off Delay & reframes 'You always' into 'I feel' statements",
  },
  {
    value: "Calm / Neutral",
    label: "😌 Calm / Neutral",
    hint: "Clean, balanced, objective framing",
  },
  {
    value: "Confident",
    label: "💪 Confident",
    hint: "Clear, self-assured, and proactive",
  },
  {
    value: "Excited",
    label: "🤩 Excited",
    hint: "Channels enthusiasm into warm, engaging energy",
  },
];

export interface VibeCheckItem {
  id: string;
  category: "lovers" | "friends";
  icon: string;
  label: string;
  relationship: string;
  situation: string;
  mood: WriterMoodOption;
  sampleDraft: string;
  vibePreview: string;
}

export const VIBE_CHECK_OPTIONS: VibeCheckItem[] = [
  // For Lovers / Dating
  {
    id: "flirty_playful",
    category: "lovers",
    icon: "💖",
    label: "Flirty & Playful",
    relationship: "Romantic Partner / Lover",
    situation: "Sharing Big News or Asking for a Favor",
    mood: "Excited",
    sampleDraft:
      "hey i can't stop thinking about our date last night, when do i get to see you again?",
    vibePreview:
      "Heyy trouble 💖 Still smiling about last night—when am I stealing you for round two? 😊✨",
  },
  {
    id: "soft_apologetic",
    category: "lovers",
    icon: "🩹",
    label: "Soft & Apologetic (De-escalating a fight)",
    relationship: "Romantic Partner / Lover",
    situation: "Apologizing After an Argument or Late Reply",
    mood: "Apologetic",
    sampleDraft:
      "i hate fighting with you. i got defensive earlier because i was stressed, i'm sorry.",
    vibePreview:
      "Hey love 🩹 I really hate when we're out of sync. I'm sorry I got defensive earlier—you mean way more to me than winning an argument. Can we talk tonight when you're ready? 💛",
  },
  {
    id: "gentle_boundary_lover",
    category: "lovers",
    icon: "🛑",
    label: "Setting a Gentle Boundary",
    relationship: "Romantic Partner / Lover",
    situation: "Setting a Gentle Personal Boundary",
    mood: "Calm / Neutral",
    sampleDraft:
      "i love talking to you but i need a couple hours to myself after work to recharge without feeling guilty.",
    vibePreview:
      "Heyy 💛 I adore our evening catch-ups, and I also realized I need about an hour offline right after work to decompress so I can be 100% present with you after. Let's call at 8? 🥺✨",
  },
  {
    id: "deep_appreciation",
    category: "lovers",
    icon: "💌",
    label: "Deep Appreciation & Support",
    relationship: "Romantic Partner / Lover",
    situation: "General",
    mood: "Confident",
    sampleDraft:
      "thank you for always listening to me when my week gets crazy, i really appreciate having you in my life.",
    vibePreview:
      "Just wanted to send a quick reminder of how grateful I am for you 💌 Thank you for being my safe space this week—I appreciate you more than you know! ✨",
  },
  // For Besties & Friends
  {
    id: "playful_teasing",
    category: "friends",
    icon: "🤣",
    label: "Playful Teasing / Banter",
    relationship: "Bestie",
    situation: "General",
    mood: "Excited",
    sampleDraft:
      "you always take 3 hours to get ready when we go out, i'm telling you departure time is 1 hour earlier next time.",
    vibePreview:
      "Bestie 🤣 I'm officially telling you our dinner is at 6 PM so we actually arrive by 7:30! Love you, don't be late! 😂✨",
  },
  {
    id: "making_plans_no_push",
    category: "friends",
    icon: "🤝",
    label: "Making Plans Without Being Pushy",
    relationship: "Close Friend",
    situation: "Sharing Big News or Asking for a Favor",
    mood: "Calm / Neutral",
    sampleDraft:
      "hey do you want to grab coffee this weekend? totally okay if you are busy.",
    vibePreview:
      "Heyy! 🤝 Thinking of grabbing iced coffee Saturday afternoon—would love to catch up if you're free, zero pressure at all if your weekend is packed! ☕✨",
  },
  {
    id: "checking_in_tough_time",
    category: "friends",
    icon: "🕯️",
    label: "Checking In (Tough Time)",
    relationship: "Bestie",
    situation: "General",
    mood: "Calm / Neutral",
    sampleDraft:
      "i know things have been really heavy for you lately. you don't have to reply right now, just wanted you to know i'm here.",
    vibePreview:
      "Hey bestie 🕯️ Sending you the biggest hug today. No need to text back at all—just wanted you to know I'm in your corner whenever you want company or a distraction 💛",
  },
  {
    id: "canceling_gracefully",
    category: "friends",
    icon: "😬",
    label: "Canceling Plans Gracefully (No Guilt)",
    relationship: "Bestie",
    situation: "Canceling Plans Last-Minute Without Hurting Feelings",
    mood: "Apologetic",
    sampleDraft:
      "i am busy today and completely drained from work, i can't make it tonight.",
    vibePreview:
      "Heyy, super packed and drained today! 🥺 Can we please rain-check and catch up tomorrow instead? Dinner is on me! 💛✨",
  },
];

export const SLANG_SCRIPT_PRESETS: {
  id: string;
  label: string;
  languageOption: string;
  coldBefore: string;
  warmAfter: string;
}[] = [
  {
    id: "warm_english",
    label: "💬 Warm Casual English + Emojis",
    languageOption: "English",
    coldBefore: "I am busy today.",
    warmAfter: "Heyy, super packed today! Can we catch up tomorrow? 🥺✨",
  },
  {
    id: "hinglish_slang",
    label: "🇮🇳 Hinglish Chat Slang",
    languageOption: "Hinglish (Hindi in English Alphabet)",
    coldBefore: "I am busy today, let's meet tomorrow.",
    warmAfter:
      "Heyy yaar, aaj super packed hoon! Kal pakka catch up karein? 🥺💛",
  },
  {
    id: "tanglish_slang",
    label: "🇮🇳 Tanglish Chat Slang",
    languageOption: "Tanglish (Tamil in English Alphabet)",
    coldBefore: "I am busy today, let's talk tomorrow.",
    warmAfter:
      "Heyy da/macha, innaiku full packed! Naalaiku kandippa catch up pannalama? 🥺✨",
  },
  {
    id: "tenglish_slang",
    label: "🇮🇳 Tenglish Chat Slang",
    languageOption: "Tenglish (Telugu in English Alphabet)",
    coldBefore: "I am busy today, let's meet tomorrow.",
    warmAfter:
      "Heyy ra, eroju full busy ga unna! Repu pakka kaluddama? 🥺💛",
  },
  {
    id: "spanglish_slang",
    label: "🌎 Spanglish Chat Slang",
    languageOption: "Spanish (Español)",
    coldBefore: "I am busy today.",
    warmAfter:
      "Heyy bestie, estoy super packed today! Nos vemos mañana for sure? 🥺✨",
  },
];

export function analyzeOverthinkingRadar(draft: string): {
  wordCount: number;
  isClingyOrLong: boolean;
  clingyMessage: string;
  passiveAggressiveHits: string[];
  pressureHits: string[];
  pressureScore: number;
  heatedYouAlwaysHits: string[];
} {
  const clean = (draft || "").trim();
  const lower = clean.toLowerCase();
  const words = clean ? clean.split(/\s+/) : [];
  const wordCount = words.length;

  const overExplainMarkers = [
    "sorry for texting again",
    "please don't hate me",
    "are you mad at me",
    "i just wanted to make sure",
    "sorry if i'm annoying",
    "i know you're busy but",
  ];
  const hasOverExplainPhrase = overExplainMarkers.some((m) =>
    lower.includes(m)
  );
  const isClingyOrLong = wordCount > 45 || hasOverExplainPhrase;
  const clingyMessage = isClingyOrLong
    ? wordCount > 45
      ? `⚠️ Clinginess / Over-explaining Warning: At ${wordCount} words, this text may feel heavy or over-explained. Shortening to 1–2 warm sentences projects calm confidence.`
      : "⚠️ Clinginess / Self-Doubt Warning: Phrases like 'are you mad at me' or 'sorry for annoying you' create anxious pressure. Swap for warm confidence!"
    : "🟢 Healthy Length: Concise, grounded, and easy to read without over-explaining.";

  const passiveTriggers = [
    "fine, whatever",
    "whatever",
    "k.",
    "i guess",
    "nevermind",
    "do what you want",
    "forget it",
    "if you say so",
    "nice to know",
  ];
  const passiveAggressiveHits = passiveTriggers.filter((t) =>
    lower.includes(t)
  );

  const pressureTriggers = [
    "reply now",
    "answer me",
    "why aren't you",
    "???",
    "hello??",
    "text me back",
    "ignoring me",
    "right now",
  ];
  const pressureHits = pressureTriggers.filter((t) => lower.includes(t));
  const pressureScore = Math.min(
    100,
    18 + pressureHits.length * 32 + (hasOverExplainPhrase ? 25 : 0)
  );

  const heatedMarkers = [
    "you always",
    "you never",
    "sick of you",
    "your fault",
    "so annoying",
    "pissed",
    "furious",
    "hate when you",
  ];
  const heatedYouAlwaysHits = heatedMarkers.filter((t) => lower.includes(t));

  return {
    wordCount,
    isClingyOrLong,
    clingyMessage,
    passiveAggressiveHits,
    pressureHits,
    pressureScore,
    heatedYouAlwaysHits,
  };
}

export const INFORMAL_RELATIONSHIPS: string[] = [
  "Bestie",
  "Close Friend",
  "Romantic Partner / Lover",
  "Family Member / Relative",
  "Acquaintance",
  "Colleague / Peer",
];

export const INFORMAL_SITUATIONS: string[] = [
  "General",
  "Clearing Up a Misunderstanding / Honest Talk",
  "Canceling Plans Last-Minute Without Hurting Feelings",
  "Setting a Gentle Personal Boundary",
  "Apologizing After an Argument or Late Reply",
  "Sharing Big News or Asking for a Favor",
];

export const LANGUAGE_AND_SCRIPT_GROUPS: {
  groupLabel: string;
  options: { value: string; label: string }[];
}[] = [
  {
    groupLabel: "Smart Auto-Detection",
    options: [
      {
        value: "Auto-Detect (Match Input Language)",
        label: "✨ Auto-Detect (Matches Your Typed Language)",
      },
    ],
  },
  {
    groupLabel: "Global & Regional Languages (Native Script)",
    options: [
      { value: "English", label: "English" },
      { value: "Spanish (Español)", label: "Spanish (Español)" },
      { value: "Hindi (हिन्दी)", label: "Hindi (हिन्दी)" },
      { value: "Tamil (தமிழ்)", label: "Tamil (தமிழ்)" },
      { value: "Telugu (తెలుగు)", label: "Telugu (తెలుగు)" },
      { value: "French (Français)", label: "French (Français)" },
      { value: "German (Deutsch)", label: "German (Deutsch)" },
      { value: "Mandarin Chinese (中文)", label: "Mandarin Chinese (中文)" },
      { value: "Arabic (العربية)", label: "Arabic (العربية)" },
      { value: "Bengali (বাংলা)", label: "Bengali (বাংলা)" },
      { value: "Portuguese (Português)", label: "Portuguese (Português)" },
      { value: "Japanese (日本語)", label: "Japanese (日本語)" },
    ],
  },
  {
    groupLabel:
      "Transliteration / Romanized Native Language (English Alphabet)",
    options: [
      {
        value: "Hinglish (Hindi in English Alphabet)",
        label: "Hinglish (Hindi typed in English letters)",
      },
      {
        value: "Tanglish (Tamil in English Alphabet)",
        label: "Tanglish (Tamil typed in English letters)",
      },
      {
        value: "Tenglish (Telugu in English Alphabet)",
        label: "Tenglish (Telugu typed in English letters)",
      },
      {
        value: "Benglish / Manglish (Romanized Regional)",
        label: "Benglish / Manglish (Romanized Regional)",
      },
      {
        value: "Romanized Arabic / Franco-Arabic (Arabizi)",
        label: "Romanized Arabic / Franco-Arabic",
      },
      {
        value: "Romanized Mandarin (Pinyin + English)",
        label: "Romanized Mandarin (Pinyin Style)",
      },
    ],
  },
];

interface PresetScenario {
  id: string;
  buttonLabel: string;
  relationship: string;
  situation: string;
  courseOrRef: string;
  draft: string;
}

interface PersonaConfig {
  id: PersonaId;
  shortLabel: string;
  fullTitle: string;
  subtitle: string;
  relationships: string[];
  situations: string[];
  placeholderHint: string;
  defaultCourseLabel: string;
  defaultCoursePlaceholder: string;
  senderPlaceholder: string;
  recipientPlaceholder: string;
  presets: PresetScenario[];
}

const PERSONA_CONFIGS: Record<PersonaId, PersonaConfig> = {
  college_student: {
    id: "college_student",
    shortLabel: "First-Year College",
    fullTitle: "Say It Right: Student-to-Professor Email Coach",
    subtitle:
      "Turn high-stress academic moments—missing an exam, asking for an extension, reviewing a low grade, or requesting a recommendation letter—into respectful, effective messages.",
    relationships: [
      "Strict / Formal Professor",
      "Friendly / Approachable Professor",
      "Department Head / Dean",
      "Teaching Assistant (TA) / Lab Instructor",
      "Academic Advisor / Financial Aid Officer",
    ],
    situations: [
      "General",
      "Extension Request",
      "Sick & Missed Exam",
      "Grade Review / Clarification",
      "Request Recommendation Letter",
      "Admitting a Mistake / Late Submission",
    ],
    placeholderHint:
      "I missed class because I was sick... (Or switch to 'Record Voice Note' to rant out loud!)",
    defaultCourseLabel: "Course Code & ID",
    defaultCoursePlaceholder: "e.g., COMP 101 - Course ID #1042",
    senderPlaceholder: "e.g., Alex Rivera (Student ID #1042)",
    recipientPlaceholder: "e.g., Professor Chen",
    presets: [
      {
        id: "sick_exam",
        buttonLabel: "🤒 Sick & Missed Exam",
        relationship: "Strict / Formal Professor",
        situation: "Sick & Missed Exam",
        courseOrRef: "COMP 101 - Course ID #1042",
        draft:
          "hey prof, i woke up with a 102 fever and severe stomach flu this morning and completely missed the 9 AM midterm exam. i'm freaking out right now. i can get a clinic note—can i please take a make-up exam this week? sorry to bother you.",
      },
      {
        id: "grade_review",
        buttonLabel: "📊 Grade Review",
        relationship: "Friendly / Approachable Professor",
        situation: "Grade Review / Clarification",
        courseOrRef: "ECON 204 - Sec 02",
        draft:
          "Hi professor, I worked really hard on Essay 2 and still got a 68%. I don't understand why you took off 15 points on the analysis section when my arguments followed the rubric. Can you look at my grade again?",
      },
      {
        id: "rec_letter",
        buttonLabel: "🌟 Request Recommendation Letter",
        relationship: "Department Head / Dean",
        situation: "Request Recommendation Letter",
        courseOrRef: "BIO 110 - Honors Seminar",
        draft:
          "Hey Professor, I'm applying for a summer undergraduate research fellowship due in two weeks and I need a recommendation letter. Since I got an A in your class last semester, could you write one for me?",
      },
      {
        id: "car_breakdown",
        buttonLabel: "🚗 Missed 9 AM Presentation (Rant)",
        relationship: "Strict / Formal Professor",
        situation: "Extension Request",
        courseOrRef: "COMM 102 - Group 4",
        draft:
          "Prof, I'm super overwhelmed, my car broke down on the highway and I can't make the 9 AM presentation! I have all my slides ready and the tow truck receipt, please don't fail me!",
      },
      {
        id: "bestie_partner_talk",
        buttonLabel: "💛 Honest Talk with Bestie / Partner",
        relationship: "Bestie",
        situation: "Clearing Up a Misunderstanding / Honest Talk",
        courseOrRef: "Personal Chat",
        draft:
          "hey i felt really hurt yesterday when you canceled our dinner plans last minute without texting me until i was already at the restaurant. i love hanging out with you but i need us to respect each other's time.",
      },
    ],
  },
  seniors: {
    id: "seniors",
    shortLabel: "Seniors & Elders",
    fullTitle: "Seniors & Older Adults Clear Advocacy Coach",
    subtitle:
      "Craft patient, dignified, plain-language messages to doctors, hospital billing departments, tech support, or family—without confusing jargon.",
    relationships: [
      "Doctor / Medical Specialist",
      "Hospital Billing / Insurance Representative",
      "Bank / Utility / Subscription Support",
      "Family Member / Adult Child",
    ],
    situations: [
      "General",
      "Questioning a Confusing Medical or Utility Bill",
      "Asking a Doctor to Explain Medication Plainly",
      "Canceling an Unwanted Subscription or Charge",
      "Asking Family for Help Without Feeling Like a Burden",
    ],
    placeholderHint:
      "Type what happened or tap 'Record Voice Note' to speak naturally.",
    defaultCourseLabel: "Account / Reference / Visit Date",
    defaultCoursePlaceholder: "e.g., Statement #88412 - Oct 2 Visit",
    senderPlaceholder: "e.g., Margaret Thompson (555-0192)",
    recipientPlaceholder: "e.g., Dr. Patel / Billing Department",
    presets: [
      {
        id: "medical_bill",
        buttonLabel: "🏥 Dispute Confusing Medical Bill",
        relationship: "Hospital Billing / Insurance Representative",
        situation: "Questioning a Confusing Medical or Utility Bill",
        courseOrRef: "Statement #88412 - Sept 18 Visit",
        draft:
          "I got a bill for $420 from my clinic visit last month and the insurance codes make no sense to me. I am on a fixed retirement income and need someone to explain in plain English why I am being charged twice.",
      },
      {
        id: "doctor_meds",
        buttonLabel: "💊 Ask Doctor to Explain Pills",
        relationship: "Doctor / Medical Specialist",
        situation: "Asking a Doctor to Explain Medication Plainly",
        courseOrRef: "Blood Pressure Prescription Update",
        draft:
          "At my appointment yesterday you changed my pills really fast and I got confused when I got home. Do I stop taking the little white pill or take both? Please explain simply.",
      },
      {
        id: "cancel_charge",
        buttonLabel: "💳 Cancel Unwanted Recurring Charge",
        relationship: "Bank / Utility / Subscription Support",
        situation: "Canceling an Unwanted Subscription or Charge",
        courseOrRef: "Account #4491 - $49.99 Monthly Fee",
        draft:
          "I noticed a $49.99 charge on my statement that I never signed up for. The website is too confusing to cancel it. Please cancel this right away and refund my money.",
      },
    ],
  },
  school_kids: {
    id: "school_kids",
    shortLabel: "Cartoon Kids Zone 🎨",
    fullTitle: "🌈 Super Kid Message Hero Lab! (Cartoon Kids Coach)",
    subtitle:
      "Team up with Captain Pencil ✏️, Professor Hoot 🦉, and Bibo Robo 🤖 to turn tricky homework, oops moments, or friend problems into brave, super-polite messages!",
    relationships: [
      "School Teacher (Kind & Helpful)",
      "Strict School Teacher / Principal",
      "Group Project Classmate / Friend",
      "Sports Coach or Club Advisor",
    ],
    situations: [
      "General",
      "Didn't Understand Homework / Need Extra Help",
      "Forgot Homework or Made a Mistake in Class",
      "Speaking Up About an Unfair Group Project",
      "Apologizing to a Friend or Teacher",
    ],
    placeholderHint:
      "Type what happened just like you're talking to a cartoon buddy—or tap 'Record Voice Note' to speak out loud! 🎤✨",
    defaultCourseLabel: "Class Name & Grade",
    defaultCoursePlaceholder: "e.g., 7th Grade Math, Period 3",
    senderPlaceholder: "e.g., Leo (Room 204)",
    recipientPlaceholder: "e.g., Mrs. Davis",
    presets: [
      {
        id: "kid_homework",
        buttonLabel: "🧮 Stuck on Tricky Math Homework!",
        relationship: "School Teacher (Kind & Helpful)",
        situation: "Didn't Understand Homework / Need Extra Help",
        courseOrRef: "7th Grade Pre-Algebra, Period 2",
        draft:
          "i tried doing worksheet 4 tonight with my mom and we both got stuck on the fraction word problems. i don't want to get in trouble tomorrow for not finishing it.",
      },
      {
        id: "kid_group",
        buttonLabel: "🌋 Unfair Group Project Partner!",
        relationship: "Group Project Classmate / Friend",
        situation: "Speaking Up About an Unfair Group Project",
        courseOrRef: "Science Fair Volcano Poster",
        draft:
          "hey you haven't done any of the slides yet and it's due friday. i don't want to do the whole thing by myself again.",
      },
      {
        id: "kid_forgot",
        buttonLabel: "🎒 Oops! Left Homework on the Table!",
        relationship: "Strict School Teacher / Principal",
        situation: "Forgot Homework or Made a Mistake in Class",
        courseOrRef: "8th Grade History, Period 4",
        draft:
          "I did my whole history poster last night on the kitchen table and accidentally left it at home when I ran for the bus. Can my mom drop it off or can I bring it tomorrow?",
      },
      {
        id: "kid_coach",
        buttonLabel: "⚽ Ask Sports Coach for Extra Practice!",
        relationship: "Sports Coach or Club Advisor",
        situation: "Didn't Understand Homework / Need Extra Help",
        courseOrRef: "After-School Soccer Team",
        draft:
          "coach i missed two goals in yesterday's game and i feel bad. can you show me how to kick better before practice starts tomorrow?",
      },
      {
        id: "kid_friend_sorry",
        buttonLabel: "💛 Say Sorry to My Best Friend!",
        relationship: "Group Project Classmate / Friend",
        situation: "Apologizing to a Friend or Teacher",
        courseOrRef: "Lunch Table & Recess",
        draft:
          "i am really sorry i got mad at recess today when we lost the game. you are my best friend and i want to sit together tomorrow.",
      },
    ],
  },
  women_advocacy: {
    id: "women_advocacy",
    shortLabel: "Women & Self-Advocacy",
    fullTitle: "Women & Self-Advocacy Boundary Coach",
    subtitle:
      "Say 'no' to uncompensated extra work, claim fair credit, push back on interruptions, and negotiate deadlines—removing reflexive apologies while staying warm.",
    relationships: [
      "Senior Professor / Thesis Advisor",
      "Workplace Manager / Department Director",
      "Cross-Functional Colleague / Project Lead",
      "Committee Chair / Client",
    ],
    situations: [
      "General",
      "Saying 'No' to Uncompensated Extra Work",
      "Advocating for Fair Credit or Authorship",
      "Negotiating a Deadline or Scope Change",
      "Addressing Being Overlooked or Interrupted",
    ],
    placeholderHint:
      "Write your honest boundary or request. Our Apology-Stripper replaces 'Sorry to be a pain' with warm executive confidence.",
    defaultCourseLabel: "Project / Lab / Role Context",
    defaultCoursePlaceholder: "e.g., Q4 Research Grant / Senior Capstone",
    senderPlaceholder: "e.g., Dr. Maya Lin / Priya Sharma",
    recipientPlaceholder: "e.g., Director Vance",
    presets: [
      {
        id: "say_no_notes",
        buttonLabel: "🛑 Say 'No' to Unpaid Extra Work",
        relationship: "Senior Professor / Thesis Advisor",
        situation: "Saying 'No' to Uncompensated Extra Work",
        courseOrRef: "Departmental Seminar Committee",
        draft:
          "I'm really sorry, I feel bad saying this, but I don't think I can take on organizing the seminar notes and catering again this month because my own thesis experiments are falling behind. Sorry to let you down!",
      },
      {
        id: "claim_credit",
        buttonLabel: "🏆 Claim Fair Credit on Project",
        relationship: "Cross-Functional Colleague / Project Lead",
        situation: "Advocating for Fair Credit or Authorship",
        courseOrRef: "Data Visualization Deck & Lab Report",
        draft:
          "Sorry to bring this up, maybe it's not a big deal, but I noticed my name wasn't listed on the presentation slides even though I built the entire statistical model last weekend.",
      },
      {
        id: "negotiate_scope",
        buttonLabel: "⚖️ Negotiate Realistic Deadline",
        relationship: "Workplace Manager / Department Director",
        situation: "Negotiating a Deadline or Scope Change",
        courseOrRef: "Q4 Product Launch Deliverable",
        draft:
          "Sorry to push back, I know everyone is stressed, but adding three new features on Wednesday means there's no way I can finish QA testing by Friday without working all weekend.",
      },
    ],
  },
  friendly_chat: {
    id: "friendly_chat",
    shortLabel: "Friendly Chat",
    fullTitle: "Friendly Chat & Everyday Personal Message Coach",
    subtitle:
      "Warm, natural, heart-to-heart messages for besties, close friends, romantic partners, family members, and everyday general conversations—without stiff formalities.",
    relationships: [
      "Bestie",
      "Close Friend",
      "Romantic Partner / Lover",
      "Family Member / Relative",
      "Roommate / Neighbor",
      "Acquaintance",
    ],
    situations: [
      "General",
      "Clearing Up a Misunderstanding / Honest Talk",
      "Canceling Plans Last-Minute Without Hurting Feelings",
      "Setting a Gentle Personal Boundary",
      "Apologizing After an Argument or Late Reply",
      "Sharing Big News or Asking for a Favor",
    ],
    placeholderHint:
      "Type in English, Hinglish, Tanglish, or any language—or record a voice note to your friend, partner, or family!",
    defaultCourseLabel: "Chat / Context Topic",
    defaultCoursePlaceholder: "e.g., Weekend Plans / General Check-In",
    senderPlaceholder: "e.g., Sam",
    recipientPlaceholder: "e.g., Jordan / My Bestie",
    presets: [
      {
        id: "friendly_general",
        buttonLabel: "💬 General Friendly Check-In / Honest Note",
        relationship: "Bestie",
        situation: "General",
        courseOrRef: "Friendly Catch-Up",
        draft:
          "hey bestie, i know we both got super busy this month and barely talked, i really miss hanging out with you and wanted to check in on how you're doing!",
      },
      {
        id: "partner_honest_talk",
        buttonLabel: "❤️ Honest Talk with Romantic Partner",
        relationship: "Romantic Partner / Lover",
        situation: "Clearing Up a Misunderstanding / Honest Talk",
        courseOrRef: "Us & Communication",
        draft:
          "i felt a little distant from you after our argument last night. i don't want us to stay mad at each other—i really care about you and want to talk openly tonight.",
      },
      {
        id: "cancel_plans_kindly",
        buttonLabel: "🛋️ Cancel Plans Last-Minute Kindly",
        relationship: "Close Friend",
        situation: "Canceling Plans Last-Minute Without Hurting Feelings",
        courseOrRef: "Friday Dinner Plans",
        draft:
          "hey i am completely exhausted after a brutal week and have a huge headache. i really can't make it to dinner tonight, please don't be mad at me!",
      },
      {
        id: "hinglish_bestie",
        buttonLabel: "🇮🇳 Hinglish Chat to Bestie",
        relationship: "Bestie",
        situation: "Apologizing After an Argument or Late Reply",
        courseOrRef: "Weekend Hangout",
        draft:
          "yaar sorry kal tera call miss ho gaya tha, main assignment mein bohot phasa hua tha. please gussa mat ho, aaj shaam ko milte hain!",
      },
    ],
  },
};

interface CrisisStarterCard {
  id: string;
  group: "kids_teens" | "college";
  emoji: string;
  title: string;
  subtitle: string;
  persona: PersonaId;
  relationship: string;
  situation: string;
  courseOrRef: string;
  draft: string;
}

const CRISIS_STARTER_CARDS: CrisisStarterCard[] = [
  // For Kids & Teens
  {
    id: "crisis_kid_assignment",
    group: "kids_teens",
    emoji: "🎒",
    title: "Asking for help on a hard assignment",
    subtitle: "Kind teacher note when homework feels super tricky",
    persona: "school_kids",
    relationship: "School Teacher (Kind & Helpful)",
    situation: "Didn't Understand Homework / Need Extra Help",
    courseOrRef: "7th Grade Math — Worksheet #4",
    draft:
      "i tried doing the homework problems tonight for an hour and i still don't get how to solve #5 and #6. can you please show me how tomorrow morning?",
  },
  {
    id: "crisis_kid_group",
    group: "kids_teens",
    emoji: "🤝",
    title: "Resolving a group project issue politely",
    subtitle: "Speak up fairly without starting a fight",
    persona: "school_kids",
    relationship: "Group Project Classmate / Friend",
    situation: "Speaking Up About an Unfair Group Project",
    courseOrRef: "Science Fair Poster Project",
    draft:
      "hey, i finished my two sections of the poster, and our project is due on Friday. which part are you going to finish tonight so we both get a good grade?",
  },
  {
    id: "crisis_kid_coach",
    group: "kids_teens",
    emoji: "⚽",
    title: "Informing a coach about a missed practice",
    subtitle: "Responsible heads-up to your sports coach",
    persona: "school_kids",
    relationship: "Sports Coach or Club Advisor",
    situation: "Forgot Homework or Made a Mistake in Class",
    courseOrRef: "Varsity / After-School Soccer Practice",
    draft:
      "coach, i have a dentist appointment after school tomorrow and my mom says i will miss practice. i will do my conditioning drills at home so i'm ready for Friday's game.",
  },
  // For College Students
  {
    id: "crisis_college_absence",
    group: "college",
    emoji: "🩺",
    title: "Emergency absence request (with clinic note)",
    subtitle: "Calm, accountable note when illness hits on exam/lecture day",
    persona: "college_student",
    relationship: "Strict / Formal Professor",
    situation: "Sick & Missed Exam",
    courseOrRef: "CHEM 201 - Section 03",
    draft:
      "hey prof, i had to go to urgent care this morning with a high fever and missed today's lecture and quiz. i have an official clinic note—how can i make up the missed work?",
  },
  {
    id: "crisis_college_grade",
    group: "college",
    emoji: "📑",
    title: "Requesting a grade clarification on a paper",
    subtitle: "Ask to review rubric feedback without sounding combative",
    persona: "college_student",
    relationship: "Friendly / Approachable Professor",
    situation: "Grade Review / Clarification",
    courseOrRef: "ENGL 105 - Analytical Paper #2",
    draft:
      "hi professor, i saw my grade on Paper 2 and was hoping to understand the rubric deductions on my thesis section so i can improve for the final paper. can we review it in office hours?",
  },
  {
    id: "crisis_college_rec",
    group: "college",
    emoji: "💼",
    title: "Asking for a recommendation letter / research spot",
    subtitle: "High-conviction, respectful pitch to faculty",
    persona: "college_student",
    relationship: "Department Head / Dean",
    situation: "Request Recommendation Letter",
    courseOrRef: "BIO 302 - Summer Research Fellowship",
    draft:
      "dear professor, i really loved your seminar this semester and earned an A on my final research project. i am applying for the summer research fellowship—would you be willing to write a strong letter of recommendation?",
  },
];

const DRAFT_STORAGE_KEY = "say_it_right_saved_draft_v2";
const DARK_MODE_STORAGE_KEY = "say_it_right_dark_mode";

export default function App() {
  // Dark Mode state with localStorage persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_MODE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(darkMode));
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark-theme-active", darkMode);
    }
  }, [darkMode]);

  // Core Configuration States
  const [persona, setPersona] = useState<PersonaId>("college_student");
  const currentPersonaConfig = PERSONA_CONFIGS[persona];

  const [relationship, setRelationship] = useState<string>(
    PERSONA_CONFIGS.college_student.relationships[0]
  );
  const [situation, setSituation] = useState<string>(
    PERSONA_CONFIGS.college_student.situations[1]
  );
  const [toneStyle, setToneStyle] = useState<ToneOption>("Polite & Direct");
  const [writerMood, setWriterMood] =
    useState<WriterMoodOption>("Anxious / Stressed");
  const [platform, setPlatform] = useState<PlatformOption>("Email");
  const [targetLanguage, setTargetLanguage] = useState<string>(
    "Auto-Detect (Match Input Language)"
  );
  const [apologyStripper, setApologyStripper] = useState<boolean>(true);
  const [simplifyLanguage, setSimplifyLanguage] = useState<boolean>(false);
  const [subtleEmojiBooster, setSubtleEmojiBooster] = useState<boolean>(false);

  // Context & Names
  const [courseOrRefCode, setCourseOrRefCode] = useState<string>(
    PERSONA_CONFIGS.college_student.presets[0].courseOrRef
  );
  const [studentName, setStudentName] = useState<string>("");
  const [professorName, setProfessorName] = useState<string>("");

  // Draft & Output States
  const [roughDraft, setRoughDraft] = useState<string>(
    PERSONA_CONFIGS.college_student.presets[0].draft
  );
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [outputTextFormat, setOutputTextFormat] = useState<OutputTextFormat>(
    "standard_paragraphs"
  );
  const [selectedVersionTab, setSelectedVersionTab] = useState<
    "warm_respectful" | "concise_direct" | "simple_clear"
  >("warm_respectful");
  const [customEditedBody, setCustomEditedBody] = useState<string | null>(null);

  // Accessibility & View Mode States
  const [simpleViewMode, setSimpleViewMode] = useState<boolean>(false);
  const [largeTextMode, setLargeTextMode] = useState<boolean>(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(true);
  const [celebrationType, setCelebrationType] = useState<
    "none" | "confetti" | "balloons" | "snow"
  >("none");

  // Cartoon Kids Zone States
  const [kidGoldStars, setKidGoldStars] = useState<number>(5);
  const [kidMascotCheer, setKidMascotCheer] = useState<string>(
    "🦸‍♂️ Captain Pencil says: Tap any cartoon picture or crisis card to power up your polite message!"
  );

  // Vibe Check & Cool-Off States
  const [selectedVibeId, setSelectedVibeId] = useState<string | null>(null);
  const [coolOffDismissed, setCoolOffDismissed] = useState<boolean>(false);

  // Interactive Safety Checklist before sending
  const [safetyChecklist, setSafetyChecklist] = useState<{
    replacedBrackets: boolean;
    officialSenderEmail: boolean;
    attachedDocuments: boolean;
  }>({
    replacedBrackets: false,
    officialSenderEmail: false,
    attachedDocuments: false,
  });

  // Active Hover/Tap Tooltip Index for Before & After Highlighting
  const [activeHighlightTooltip, setActiveHighlightTooltip] = useState<
    number | null
  >(0);

  // Analysis & Loading States
  const [analysis, setAnalysis] = useState<any>(() =>
    buildFallbackResponse({
      roughDraft: PERSONA_CONFIGS.college_student.presets[0].draft,
      persona: "college_student",
      relationship: PERSONA_CONFIGS.college_student.relationships[0],
      situation: PERSONA_CONFIGS.college_student.situations[1],
      toneStyle: "Polite & Direct",
      writerMood: "Anxious / Stressed",
      platform: "Email",
      apologyStripper: true,
      simplifyLanguage: false,
      targetLanguage: "English",
      courseOrRefCode: PERSONA_CONFIGS.college_student.presets[0].courseOrRef,
    })
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSimulatingReaction, setIsSimulatingReaction] =
    useState<boolean>(false);
  const [showReactionPanel, setShowReactionPanel] = useState<boolean>(true);

  // Copy, Download & PDF Export Feedback States
  const [copiedMain, setCopiedMain] = useState<boolean>(false);
  const [copiedSubjectIdx, setCopiedSubjectIdx] = useState<number | null>(null);
  const [exportedPdfSuccess, setExportedPdfSuccess] = useState<boolean>(false);

  // Save / Load Draft States
  const [savedDraftStatus, setSavedDraftStatus] = useState<string | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Read Aloud & Voice Recording States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Cute Robo Word Trigger
  const [externalWordTrigger, setExternalWordTrigger] = useState<string | null>(
    null
  );

  // Global Keyboard Shortcuts Modal & Toast
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  const triggerShortcutToast = (msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => {
      setShortcutToast((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Web Audio API Calming / Cheer Sound Effects
  const playFeedbackSound = (type: "calm_chime" | "kid_star" | "pop") => {
    if (!soundEffectsEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "calm_chime") {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + idx * 0.09);
          gain.gain.setValueAtTime(0.08, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.46);
        });
      } else if (type === "kid_star") {
        const freqs = [587.33, 880, 1174.66];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, now + idx * 0.07);
          gain.gain.setValueAtTime(0.1, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.32);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Ignore audio context autoplay blocks
    }
  };

  const launchCelebration = (
    mode: "confetti" | "balloons" | "snow" = "confetti"
  ) => {
    setCelebrationType(mode);
    playFeedbackSound(persona === "school_kids" ? "kid_star" : "calm_chime");
    setTimeout(() => {
      setCelebrationType("none");
    }, 3800);
  };

  // Derived language detection & Overthinking Shield metrics
  const detectedLangInfo = detectInputLanguage(roughDraft);
  const resolvedLanguage =
    targetLanguage === "Auto-Detect (Match Input Language)"
      ? detectedLangInfo.matchedLanguageOption
      : targetLanguage;

  const overthinkingMetrics = analyzeOverthinkingRadar(roughDraft);
  const isHeatedMoment =
    writerMood === "Angry / Heated" ||
    writerMood === "Frustrated" ||
    overthinkingMetrics.heatedYouAlwaysHits.length > 0;

  // Switch persona cleanly
  const handleSelectPersona = (newPersona: PersonaId) => {
    const cfg = PERSONA_CONFIGS[newPersona];
    setPersona(newPersona);
    setRelationship(cfg.relationships[0]);
    setSituation(cfg.situations[1] || cfg.situations[0]);
    const firstPreset = cfg.presets[0];
    if (firstPreset) {
      setCourseOrRefCode(firstPreset.courseOrRef);
      setRoughDraft(firstPreset.draft);
      setRelationship(firstPreset.relationship);
      setSituation(firstPreset.situation);
    }
    if (newPersona === "friendly_chat") {
      setPlatform("WhatsApp / Text Message");
    } else if (newPersona === "school_kids" || newPersona === "seniors") {
      setSimplifyLanguage(true);
    } else {
      setPlatform("Email");
      setSimplifyLanguage(false);
    }
    setCustomEditedBody(null);
    playFeedbackSound("pop");
  };

  // Reframe "You always / You never" into "I feel" statements
  const handleReframeIFeelStatements = () => {
    let updated = roughDraft
      .replace(/\byou always\b/gi, "I feel overwhelmed when")
      .replace(/\byou never\b/gi, "I would really appreciate it if we could")
      .replace(/\byour fault\b/gi, "a tough misunderstanding for both of us")
      .replace(/\bwhatever\b/gi, "I want us to be on the same page");
    if (updated === roughDraft) {
      updated = `I feel hurt and overwhelmed right now, and because I care about our connection, I want to talk this through calmly: ${roughDraft}`;
    }
    setRoughDraft(updated);
    setWriterMood("Calm / Neutral");
    setCoolOffDismissed(true);
    triggerShortcutToast("🕊️ Reframed with 'I feel' statements!");
    handleGenerate({ draftOverride: updated, moodOverride: "Calm / Neutral" });
  };

  // Save & Load Draft Helpers
  const saveCurrentDraftToStorage = () => {
    try {
      const payload = {
        persona,
        relationship,
        situation,
        toneStyle,
        writerMood,
        platform,
        courseOrRefCode,
        studentName,
        professorName,
        roughDraft,
        savedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setHasStoredDraft(true);
      setSavedDraftStatus(`Saved (${payload.savedAt})`);
      setTimeout(() => setSavedDraftStatus(null), 3000);
    } catch {
      setSavedDraftStatus("Save failed");
    }
  };

  const loadSavedDraftFromStorage = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.persona && PERSONA_CONFIGS[data.persona as PersonaId]) {
        setPersona(data.persona);
      }
      if (data.relationship) setRelationship(data.relationship);
      if (data.situation) setSituation(data.situation);
      if (data.toneStyle) setToneStyle(data.toneStyle);
      if (data.writerMood) setWriterMood(data.writerMood);
      if (data.platform) setPlatform(data.platform);
      if (typeof data.courseOrRefCode === "string")
        setCourseOrRefCode(data.courseOrRefCode);
      if (typeof data.studentName === "string")
        setStudentName(data.studentName);
      if (typeof data.professorName === "string")
        setProfessorName(data.professorName);
      if (typeof data.roughDraft === "string") setRoughDraft(data.roughDraft);
      setCustomEditedBody(null);
      setSavedDraftStatus("Loaded saved draft!");
      setTimeout(() => setSavedDraftStatus(null), 2500);
    } catch {
      // Ignore invalid JSON
    }
  };

  // Main Generate / Polish Handler
  const handleGenerate = async (overrides?: {
    draftOverride?: string;
    personaOverride?: PersonaId;
    relationshipOverride?: string;
    situationOverride?: string;
    courseOverride?: string;
    moodOverride?: WriterMoodOption;
    languageOverride?: string;
    audioBase64?: string;
    audioMimeType?: string;
    celebrate?: boolean;
  }) => {
    const activePersona = overrides?.personaOverride || persona;
    const activeRel = overrides?.relationshipOverride || relationship;
    const activeSit = overrides?.situationOverride || situation;
    const activeCourse =
      overrides?.courseOverride !== undefined
        ? overrides.courseOverride
        : courseOrRefCode;
    const activeDraft =
      overrides?.draftOverride !== undefined
        ? overrides.draftOverride
        : roughDraft;
    const activeMood = overrides?.moodOverride || writerMood;
    const activeLang = overrides?.languageOverride || resolvedLanguage;

    setIsGenerating(true);
    setCustomEditedBody(null);

    const immediateFallback = buildFallbackResponse({
      roughDraft: activeDraft,
      persona: activePersona,
      relationship: activeRel,
      situation: activeSit,
      toneStyle,
      writerMood: activeMood,
      platform,
      apologyStripper,
      simplifyLanguage,
      targetLanguage: activeLang,
      courseOrRefCode: activeCourse,
      studentName,
      professorName,
    });

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roughDraft: activeDraft,
          persona: activePersona,
          personaLabel: PERSONA_CONFIGS[activePersona].fullTitle,
          relationship: activeRel,
          situation: activeSit,
          toneStyle,
          writerMood: activeMood,
          platform,
          apologyStripper,
          simplifyLanguage,
          targetLanguage: activeLang,
          courseOrRefCode: activeCourse,
          studentName,
          professorName,
          audioBase64: overrides?.audioBase64 || "",
          audioMimeType: overrides?.audioMimeType || "audio/webm",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        if (overrides?.audioBase64 && data.transcribed_text) {
          setRoughDraft(data.transcribed_text);
        }
      } else {
        setAnalysis(immediateFallback);
      }
    } catch {
      setAnalysis(immediateFallback);
    } finally {
      setIsGenerating(false);
      if (overrides?.celebrate !== false) {
        launchCelebration(
          activePersona === "school_kids" ? "balloons" : "confetti"
        );
        if (activePersona === "school_kids") {
          setKidGoldStars((s) => s + 1);
        }
      }
    }
  };

  // Run initial analysis on first mount
  useEffect(() => {
    const firstPreset = PERSONA_CONFIGS.college_student.presets[0];
    handleGenerate({
      draftOverride: firstPreset.draft,
      personaOverride: "college_student",
      relationshipOverride: firstPreset.relationship,
      situationOverride: firstPreset.situation,
      courseOverride: firstPreset.courseOrRef,
      celebrate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute the active base message from the selected tab + optional emoji booster + format selector
  const rawSelectedVersionText =
    analysis?.versions?.[selectedVersionTab] || analysis?.polished_email || "";

  const emojiBoostedText = subtleEmojiBooster
    ? `${rawSelectedVersionText.trim()} 🥺✨💛`
    : rawSelectedVersionText;

  const formattedOutputBody = formatOutputText(
    emojiBoostedText,
    outputTextFormat,
    {
      subjectLine: analysis?.subject_line || "",
      recipient: professorName || relationship,
      sender: studentName || "[Your Name]",
      courseOrRef: courseOrRefCode,
    }
  );

  const displayedEmailBody =
    customEditedBody !== null ? customEditedBody : formattedOutputBody;

  // Copy & Download helpers
  const copySubject = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectIdx(idx);
    setTimeout(() => setCopiedSubjectIdx(null), 2000);
  };

  const copyMainOutput = () => {
    const fullText =
      platform === "Email" && analysis?.subject_line
        ? `Subject: ${analysis.subject_line}\n\n${displayedEmailBody}`
        : displayedEmailBody;
    navigator.clipboard.writeText(fullText);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 2200);
  };

  const downloadTxtFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to sanitize text for standard PDF fonts while keeping clean punctuation and structure
  const toPdfSafeText = (input: string): string => {
    if (!input) return "";
    return input
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2022/g, "*")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "")
      .trim();
  };

  const downloadFormattedPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      // Top Branded Header Banner
      doc.setFillColor(15, 118, 110); // Teal-700
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Say It Right - Polished Communication Document", margin, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      doc.text(
        toPdfSafeText(
          `Mode: ${currentPersonaConfig.shortLabel}  |  Channel: ${platform}  |  Tone: ${toneStyle}  |  Date: ${dateStr}`
        ),
        margin,
        20
      );

      y = 36;

      // Metadata & Etiquette Scorecard Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "FD");

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(
        toPdfSafeText(
          `Recipient: ${professorName || relationship}   |   Context / Ref: ${
            courseOrRefCode || "General"
          }`
        ),
        margin + 4,
        y + 8
      );

      const politenessScore =
        analysis?.readiness_scorecard?.politeness_score ?? 97;
      const clarityScore = analysis?.readiness_scorecard?.clarity_score ?? 94;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 118, 110);
      doc.text(
        toPdfSafeText(
          `Etiquette Scorecard: Politeness ${politenessScore}/100  |  Clarity ${clarityScore}/100  |  Status: Safe to Send`
        ),
        margin + 4,
        y + 16
      );

      y += 31;

      // Subject Line Box (if Email)
      if (platform === "Email" && analysis?.subject_line) {
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(153, 246, 228);
        doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 118, 110);
        doc.text("SUBJECT LINE:", margin + 4, y + 8.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const safeSubj = toPdfSafeText(analysis.subject_line);
        doc.text(safeSubj.slice(0, 85), margin + 33, y + 8.5);
        y += 20;
      }

      // Main Polished Message Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Polished Ready-to-Send Message:", margin, y);
      y += 5;

      const bodyText =
        toPdfSafeText(displayedEmailBody) ||
        toPdfSafeText(analysis?.polished_email || "");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const wrappedBody: string[] = doc.splitTextToSize(
        bodyText,
        contentWidth - 10
      );
      const boxHeight = Math.max(40, wrappedBody.length * 5.4 + 10);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "FD");

      doc.setTextColor(30, 41, 59);
      doc.text(wrappedBody, margin + 5, y + 8);
      y += boxHeight + 10;

      // Key Before & After Phrase Upgrades (if space allows)
      if (
        Array.isArray(analysis?.before_after_highlights) &&
        analysis.before_after_highlights.length > 0 &&
        y < pageHeight - 45
      ) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 118, 110);
        doc.text("Key Etiquette & Phrase Upgrades:", margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        for (const item of analysis.before_after_highlights.slice(0, 2)) {
          if (y > pageHeight - 25) break;
          const lineText = toPdfSafeText(
            `* Upgraded: "${item.polished_green}" (${item.reason})`
          );
          const lines = doc.splitTextToSize(lineText, contentWidth - 4);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 2, y);
          y += lines.length * 4.5 + 2;
        }
      }

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Generated by Say It Right: Universal & Student Communication Coach",
        margin,
        pageHeight - 10
      );

      doc.save("SayItRight_Polished_Message.pdf");
      setExportedPdfSuccess(true);
      setTimeout(() => setExportedPdfSuccess(false), 3000);
    } catch {
      downloadTxtFile(
        "SayItRight_Polished_Message.txt",
        `${
          platform === "Email" && analysis?.subject_line
            ? `Subject: ${analysis.subject_line}\n\n`
            : ""
        }${displayedEmailBody}`
      );
    }
  };

  // Read Aloud TTS (Uses Gemini 3.8 Flash Lite TTS with seamless browser SpeechSynthesis fallback)
  const toggleReadAloud = async (textToSpeak: string) => {
    if (isSpeaking) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const clean = (textToSpeak || "").trim();
    if (!clean) return;
    setIsSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, persona }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const mime = data.mimeType || "audio/wav";
          const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
          audioPlayerRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = persona === "seniors" ? 0.9 : 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  // Voice Note Recording ("Rant-to-Email")
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startVoiceRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = String(reader.result || "").split(",")[1] || "";
          if (base64) {
            handleGenerate({
              audioBase64: base64,
              audioMimeType: blob.type || "audio/webm",
            });
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Simulate Recipient Reaction
  const handleSimulateReaction = async () => {
    setIsSimulatingReaction(true);
    setShowReactionPanel(true);
    try {
      const res = await fetch("/api/simulate-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polishedEmail: displayedEmailBody,
          relationship,
          situation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis((prev: any) => ({
          ...prev,
          professor_reactions: data,
        }));
      }
    } catch {
      // Keep existing reactions
    } finally {
      setIsSimulatingReaction(false);
    }
  };

  // Global Keyboard Shortcuts Listener
  const shortcutHandlersRef = useRef({
    generate: () => handleGenerate(),
    save: () => saveCurrentDraftToStorage(),
    copy: () => copyMainOutput(),
    exportPdf: () => downloadFormattedPdf(),
    toggleDark: () => setDarkMode((d) => !d),
    readAloud: () => toggleReadAloud(displayedEmailBody),
  });

  useEffect(() => {
    shortcutHandlersRef.current = {
      generate: () => handleGenerate(),
      save: () => saveCurrentDraftToStorage(),
      copy: () => copyMainOutput(),
      exportPdf: () => downloadFormattedPdf(),
      toggleDark: () => setDarkMode((d) => !d),
      readAloud: () => toggleReadAloud(displayedEmailBody),
    };
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      if (e.key === "Escape" && showShortcutsModal) {
        e.preventDefault();
        setShowShortcutsModal(false);
        return;
      }

      // Ctrl+Enter or Cmd+Enter -> Generate Polished Draft
      if (isMod && e.key === "Enter") {
        e.preventDefault();
        triggerShortcutToast("⚡ Shortcut: Polishing your message...");
        shortcutHandlersRef.current.generate();
        return;
      }

      // Ctrl+S or Cmd+S -> Save Draft
      if (isMod && !e.shiftKey && keyLower === "s") {
        e.preventDefault();
        shortcutHandlersRef.current.save();
        triggerShortcutToast("💾 Shortcut: Draft saved to browser!");
        return;
      }

      // Ctrl+Shift+C or Cmd+Shift+C -> Copy Polished Message
      if (isMod && e.shiftKey && keyLower === "c") {
        e.preventDefault();
        shortcutHandlersRef.current.copy();
        triggerShortcutToast("📋 Shortcut: Copied polished message!");
        return;
      }

      // Ctrl+Shift+E or Cmd+Shift+E -> Export PDF
      if (isMod && e.shiftKey && keyLower === "e") {
        e.preventDefault();
        shortcutHandlersRef.current.exportPdf();
        triggerShortcutToast("📄 Shortcut: Exporting formatted PDF...");
        return;
      }

      // Alt+D -> Toggle Dark Mode
      if (e.altKey && keyLower === "d") {
        e.preventDefault();
        shortcutHandlersRef.current.toggleDark();
        triggerShortcutToast("🌙 Shortcut: Toggled Dark / Light Theme!");
        return;
      }

      // Alt+R -> Toggle Read Aloud
      if (e.altKey && keyLower === "r") {
        e.preventDefault();
        shortcutHandlersRef.current.readAloud();
        triggerShortcutToast("🔊 Shortcut: Toggled Read Aloud Audio!");
        return;
      }

      // Ctrl+/ or Cmd+/ -> Toggle Keyboard Shortcuts Modal
      if (isMod && e.key === "/") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showShortcutsModal]);

  // Scores & Achievement Badges Calculation
  const politenessScore =
    analysis?.readiness_scorecard?.politeness_score ?? 97;
  const clarityScore = analysis?.readiness_scorecard?.clarity_score ?? 94;
  const rawScore =
    analysis?.readiness_scorecard?.raw_professionalism_score ?? 45;

  const getScoreColorBadge = (score: number) => {
    if (score >= 80) {
      return {
        ring: "#10B981",
        bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
        bar: "bg-emerald-500",
        label: "🟢 Safe & Effective",
      };
    }
    if (score >= 55) {
      return {
        ring: "#F59E0B",
        bg: "bg-amber-50 border-amber-300 text-amber-900",
        bar: "bg-amber-500",
        label: "🟡 Review Suggested",
      };
    }
    return {
      ring: "#EF4444",
      bg: "bg-rose-50 border-rose-300 text-rose-900",
      bar: "bg-rose-500",
      label: "🔴 Risky / Emotional",
    };
  };

  const achievementBadges = [
    {
      id: "no_passive",
      icon: "🛡️",
      label: "No Passive-Aggression",
      earned: overthinkingMetrics.passiveAggressiveHits.length === 0,
      desc: "Warm, blame-free phrasing",
    },
    {
      id: "clear_subject",
      icon: "✨",
      label: "Clear Subject Line",
      earned: Boolean(analysis?.subject_line),
      desc: "Includes context & topic",
    },
    {
      id: "direct_respectful",
      icon: "🎯",
      label: "Direct & Respectful",
      earned: politenessScore >= 85 && clarityScore >= 85,
      desc: `${politenessScore}/100 politeness & ${clarityScore}/100 clarity`,
    },
    {
      id: "confident_advocacy",
      icon: "💪",
      label: "Apology-Free Confidence",
      earned: apologyStripper,
      desc: "Swapped 'sorry to bother' for gratitude",
    },
  ];

  // Calming Anxiety-Buster Pastel Background according to persona & mood
  const calmingRootBgClass = darkMode
    ? "bg-slate-950 text-slate-100"
    : persona === "school_kids"
    ? "bg-gradient-to-br from-sky-200 via-amber-100 to-pink-200 text-slate-900"
    : writerMood === "Anxious / Stressed"
    ? "bg-gradient-to-br from-sky-50 via-teal-50/70 to-emerald-50/80 text-slate-900"
    : writerMood === "Frustrated" || writerMood === "Angry / Heated"
    ? "bg-gradient-to-br from-purple-50/80 via-sky-50 to-teal-50/70 text-slate-900"
    : "bg-gradient-to-br from-teal-50/60 via-slate-50 to-indigo-50/60 text-slate-900";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${calmingRootBgClass} ${
        largeTextMode ? "text-lg" : "text-base"
      }`}
    >
      {/* Cartoon Kids Scrolling Backdrop (when Kids mode is active) */}
      {persona === "school_kids" && <KidsCartoonBackdrop />}

      {/* Anxiety-Buster Celebration Overlay (Confetti / Balloons / Snow) */}
      {celebrationType !== "none" && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 22 }).map((_, i) => {
            const left = `${(i * 17) % 96}%`;
            const delay = `${(i % 7) * 0.15}s`;
            const symbol =
              celebrationType === "balloons"
                ? ["🎈", "🌟", "🎉", "🦸‍♂️", "✨"][i % 5]
                : celebrationType === "snow"
                ? ["❄️", "✨", "🕊️", "💠"][i % 4]
                : ["🎉", "✨", "🌟", "💚", "🎊"][i % 5];
            const animClass =
              celebrationType === "balloons"
                ? "animate-balloon-rise"
                : celebrationType === "snow"
                ? "animate-snow-fall"
                : "animate-confetti-fall";
            return (
              <div
                key={i}
                style={{ left, animationDelay: delay }}
                className={`absolute text-2xl select-none ${animClass}`}
              >
                {symbol}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Keyboard Shortcut Toast Banner */}
      {shortcutToast && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-teal-400/50 flex items-center gap-2 text-xs font-bold animate-bounce">
          <Keyboard className="w-4 h-4 text-teal-300" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat-Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  Power-User Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              {[
                {
                  keys: "Ctrl + Enter (or ⌘ + Enter)",
                  desc: "Generate & Polish Draft immediately",
                },
                {
                  keys: "Ctrl + S (or ⌘ + S)",
                  desc: "Save current draft & settings to browser",
                },
                {
                  keys: "Ctrl + Shift + C",
                  desc: "Copy polished ready-to-send message",
                },
                {
                  keys: "Ctrl + Shift + E",
                  desc: "Export polished message as formatted PDF",
                },
                {
                  keys: "Alt + D",
                  desc: "Toggle Dark Mode / Light Mode theme",
                },
                {
                  keys: "Alt + R",
                  desc: "Read polished message aloud (Voice Preview)",
                },
                {
                  keys: "Ctrl + /",
                  desc: "Open or close this Shortcuts Guide",
                },
              ].map((sc) => (
                <div
                  key={sc.keys}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {sc.desc}
                  </span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-slate-300 dark:border-slate-600 rounded-md shadow-2xs">
                    {sc.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer"
              >
                Got It! (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  Say It Right
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Universal &amp; Student Coach
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Follow 3 easy steps: <strong className="text-teal-700 dark:text-teal-300">1. Choose Who</strong> →{" "}
                <strong className="text-teal-700 dark:text-teal-300">2. Write or Speak</strong> →{" "}
                <strong className="text-teal-700 dark:text-teal-300">3. Copy or Export PDF</strong>
              </p>
            </div>
          </div>

          {/* Right Accessibility, Sound, Shortcuts & Dark Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimpleViewMode((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                simpleViewMode
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="Hides extra coaching cards so the page is ultra-simple for any age"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>{simpleViewMode ? "Simple View: ON" : "Simple View (All Ages)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setLargeTextMode((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                largeTextMode
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="Increases font size for Seniors, Kids, and easier reading"
            >
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{largeTextMode ? "Large Text: ON" : "Large Text"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEffectsEnabled((s) => !s)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                soundEffectsEnabled
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-300"
              }`}
              title="Toggle calming Anxiety-Buster chime sounds"
            >
              {soundEffectsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Calm Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Power-User Global Keyboard Shortcuts (Ctrl+/)"
            >
              <Keyboard className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded">
                Ctrl+/
              </kbd>
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle Dark Mode"
              title="Switch between Light and Dark theme (Alt+D)"
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                darkMode
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/50 hover:bg-amber-400/30"
                  : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audience Mode Selector Bar */}
        <div className="bg-slate-50/90 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Who is writing?
            </span>
            {(Object.keys(PERSONA_CONFIGS) as PersonaId[]).map((pid) => {
              const cfg = PERSONA_CONFIGS[pid];
              const isSelected = persona === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => handleSelectPersona(pid)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? pid === "school_kids"
                        ? "bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                        : "bg-teal-700 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {pid === "college_student" && (
                    <GraduationCap className="w-3.5 h-3.5" />
                  )}
                  {pid === "seniors" && <UserCheck className="w-3.5 h-3.5" />}
                  {pid === "school_kids" && (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {pid === "women_advocacy" && (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {pid === "friendly_chat" && (
                    <MessageCircleHeart className="w-3.5 h-3.5" />
                  )}
                  <span>{cfg.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* CARTOON KIDS CLUBHOUSE BANNER & PARADE STRIP (When School Kids Mode is Active) */}
        {persona === "school_kids" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-300 border-4 border-slate-900 p-5 shadow-[6px_6px_0px_0px_#0f172a]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border-3 border-slate-900 flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_#0f172a]">
                    🦸‍♂️
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-pink-500 text-white border-2 border-slate-900">
                      🎨 CARTOON KIDS CLUBHOUSE
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-0.5">
                      {currentPersonaConfig.fullTitle}
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {kidMascotCheer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-600">
                      Polite Hero Stars
                    </p>
                    <p className="text-lg font-extrabold text-amber-600">
                      {kidGoldStars} Gold Stars!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <KidsCartoonParadeStrip
              onTapCartoonCard={(cheer) => {
                setKidMascotCheer(cheer);
                setKidGoldStars((s) => s + 1);
                playFeedbackSound("kid_star");
              }}
            />
          </section>
        )}

        {/* SCENARIO CARDS & ONE-CLICK "CRISIS STARTERS" */}
        <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>
                  One-Click &ldquo;Crisis Starter&rdquo; Scenario Cards (Frozen? Pick a
                  Situation Below!)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any stressful student or school scenario card to load a
                ready-to-polish draft immediately.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kids & Teens Crisis Starters */}
            <div className="rounded-xl bg-amber-50/70 dark:bg-slate-800/70 border border-amber-200 dark:border-slate-700 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2">
                🎒 For Kids &amp; Teens
              </p>
              <div className="grid grid-cols-1 gap-2">
                {CRISIS_STARTER_CARDS.filter(
                  (c) => c.group === "kids_teens"
                ).map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setPersona(card.persona);
                      setRelationship(card.relationship);
                      setSituation(card.situation);
                      setCourseOrRefCode(card.courseOrRef);
                      setRoughDraft(card.draft);
                      handleGenerate({
                        draftOverride: card.draft,
                        personaOverride: card.persona,
                        relationshipOverride: card.relationship,
                        situationOverride: card.situation,
                        courseOverride: card.courseOrRef,
                      });
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-100/60 border border-amber-300/80 dark:border-slate-700 transition-all flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{card.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {card.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* College Students Crisis Starters */}
            <div className="rounded-xl bg-teal-50/70 dark:bg-slate-800/70 border border-teal-200 dark:border-slate-700 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-300 mb-2">
                🎓 For College Students
              </p>
              <div className="grid grid-cols-1 gap-2">
                {CRISIS_STARTER_CARDS.filter((c) => c.group === "college").map(
                  (card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setPersona(card.persona);
                        setRelationship(card.relationship);
                        setSituation(card.situation);
                        setCourseOrRefCode(card.courseOrRef);
                        setRoughDraft(card.draft);
                        handleGenerate({
                          draftOverride: card.draft,
                          personaOverride: card.persona,
                          relationshipOverride: card.relationship,
                          situationOverride: card.situation,
                          courseOverride: card.courseOrRef,
                        });
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-100/60 border border-teal-300/80 dark:border-slate-700 transition-all flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{card.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {card.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-teal-700 shrink-0" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP-BY-STEP 2-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: STEP 1 (CHOOSE WHO & WHY) + STEP 2 (WRITE OR SPEAK) */}
          <div className="lg:col-span-5 space-y-6">
            {/* STEP 1 CARD */}
            <div
              className={`rounded-2xl p-5 border shadow-xs ${
                persona === "school_kids"
                  ? "bg-white border-4 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a]"
                  : "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h2 className="font-bold text-base text-slate-900 dark:text-white">
                    Step 1: Choose Who &amp; Why
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick who you are messaging, your situation, and how you want
                    to sound.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Recipient Relationship */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Who are you messaging? (Recipient)
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium"
                  >
                    <optgroup label={`${currentPersonaConfig.shortLabel} Recipients`}>
                      {currentPersonaConfig.relationships.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Informal / Personal (Bestie, Lover, Family)">
                      {INFORMAL_RELATIONSHIPS.map((rel) => (
                        <option key={`inf-${rel}`} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Situation Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    What is the situation?
                  </label>
                  <select
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium"
                  >
                    <optgroup label={`${currentPersonaConfig.shortLabel} Situations`}>
                      {currentPersonaConfig.situations.map((sit) => (
                        <option key={sit} value={sit}>
                          {sit}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Personal & Everyday Situations">
                      {INFORMAL_SITUATIONS.map((sit) => (
                        <option key={`infsit-${sit}`} value={sit}>
                          {sit}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Channel Toggle (Email vs WhatsApp vs Slack) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Where will you send this? (Platform)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "Email", label: "📧 Email", icon: Mail },
                        {
                          id: "WhatsApp / Text Message",
                          label: "💬 WhatsApp / Text",
                          icon: MessageSquare,
                        },
                        {
                          id: "Slack / Discord",
                          label: "💬 Slack / Discord",
                          icon: Hash,
                        },
                      ] as const
                    ).map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setPlatform(ch.id)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          platform === ch.id
                            ? "bg-teal-700 text-white border-teal-700"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Writer Mood & Target Tone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      How do you feel right now?
                    </label>
                    <select
                      value={writerMood}
                      onChange={(e) => {
                        setWriterMood(e.target.value as WriterMoodOption);
                        setCoolOffDismissed(false);
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
                    >
                      {WRITER_MOOD_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      How do you want to sound?
                    </label>
                    <select
                      value={toneStyle}
                      onChange={(e) =>
                        setToneStyle(e.target.value as ToneOption)
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
                    >
                      {(
                        [
                          "Polite & Direct",
                          "Ultra Formal",
                          "Apologetic",
                          "Persuasive",
                        ] as ToneOption[]
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language & Romanized Script Selector (Hinglish / Tanglish / Global) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      Output Language / Chat Slang Script
                    </span>
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                      Detected: {detectedLangInfo.detectedLabel}
                    </span>
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
                  >
                    {LANGUAGE_AND_SCRIPT_GROUPS.map((grp) => (
                      <optgroup key={grp.groupLabel} label={grp.groupLabel}>
                        {grp.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Optional Course / Sender / Recipient Details */}
                {!simpleViewMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        {currentPersonaConfig.defaultCourseLabel}
                      </label>
                      <input
                        type="text"
                        value={courseOrRefCode}
                        onChange={(e) => setCourseOrRefCode(e.target.value)}
                        placeholder={
                          currentPersonaConfig.defaultCoursePlaceholder
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder={currentPersonaConfig.senderPlaceholder}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={professorName}
                        onChange={(e) => setProfessorName(e.target.value)}
                        placeholder={currentPersonaConfig.recipientPlaceholder}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Boosters: Apology-Stripper, Plain-Language, Subtle Emoji Booster */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apologyStripper}
                      onChange={(e) => setApologyStripper(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600"
                    />
                    <span>🛡️ Apology-Stripper</span>
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simplifyLanguage}
                      onChange={(e) => setSimplifyLanguage(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600"
                    />
                    <span>📖 Plain Language (Kids/Seniors)</span>
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subtleEmojiBooster}
                      onChange={(e) => setSubtleEmojiBooster(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600"
                    />
                    <span>🥺 Subtle Warm Emojis</span>
                  </label>
                </div>
              </div>
            </div>

            {/* "VIBE CHECK" & INTENT SELECTOR + HINGLISH/TANGLISH SLANG ADAPTER */}
            {!simpleViewMode && (
              <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageCircleHeart className="w-4 h-4 text-pink-600" />
                    <span>
                      &ldquo;Vibe Check&rdquo; &amp; Intent Selector (Lovers, Dating &amp;
                      Besties)
                    </span>
                  </h3>
                  <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    1-Click Tone Vibe
                  </span>
                </div>

                {/* Lovers / Dating Vibes */}
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1.5">
                    💖 For Lovers / Dating
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VIBE_CHECK_OPTIONS.filter(
                      (v) => v.category === "lovers"
                    ).map((vibe) => (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => {
                          setSelectedVibeId(vibe.id);
                          setPersona("friendly_chat");
                          setPlatform("WhatsApp / Text Message");
                          setRelationship(vibe.relationship);
                          setSituation(vibe.situation);
                          setWriterMood(vibe.mood);
                          setRoughDraft(vibe.sampleDraft);
                          handleGenerate({
                            draftOverride: vibe.sampleDraft,
                            personaOverride: "friendly_chat",
                            relationshipOverride: vibe.relationship,
                            situationOverride: vibe.situation,
                            moodOverride: vibe.mood,
                          });
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          selectedVibeId === vibe.id
                            ? "bg-rose-50 border-rose-400 text-rose-950 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-rose-50/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span className="text-base">{vibe.icon}</span>
                        <span className="truncate">{vibe.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Besties & Friends Vibes */}
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1.5">
                    🤝 For Besties &amp; Friends
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VIBE_CHECK_OPTIONS.filter(
                      (v) => v.category === "friends"
                    ).map((vibe) => (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => {
                          setSelectedVibeId(vibe.id);
                          setPersona("friendly_chat");
                          setPlatform("WhatsApp / Text Message");
                          setRelationship(vibe.relationship);
                          setSituation(vibe.situation);
                          setWriterMood(vibe.mood);
                          setRoughDraft(vibe.sampleDraft);
                          handleGenerate({
                            draftOverride: vibe.sampleDraft,
                            personaOverride: "friendly_chat",
                            relationshipOverride: vibe.relationship,
                            situationOverride: vibe.situation,
                            moodOverride: vibe.mood,
                          });
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          selectedVibeId === vibe.id
                            ? "bg-amber-50 border-amber-400 text-amber-950 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-amber-50/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span className="text-base">{vibe.icon}</span>
                        <span className="truncate">{vibe.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hinglish / Tanglish / Spanglish Chat Slang Adapter Presets */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1.5">
                    🌏 Hinglish / Tanglish / Spanglish Chat Slang Presets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SLANG_SCRIPT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setTargetLanguage(preset.languageOption);
                          setSubtleEmojiBooster(true);
                          setRoughDraft(preset.coldBefore);
                          setCustomEditedBody(preset.warmAfter);
                          triggerShortcutToast(`✨ Applied ${preset.label}!`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-slate-700 text-[11px] font-semibold cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 CARD: WRITE OR SPEAK YOUR DRAFT */}
            <div
              className={`rounded-2xl p-5 border shadow-xs ${
                persona === "school_kids"
                  ? "bg-white border-4 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a]"
                  : "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      Step 2: Write or Speak Your Rough Draft
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Don&apos;t worry about sounding polite yet—just type or
                      record what happened!
                    </p>
                  </div>
                </div>

                {/* Save & Load Draft Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={saveCurrentDraftToStorage}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Save current draft (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5 text-teal-700" />
                    <span>Save</span>
                    <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-300">
                      Ctrl+S
                    </kbd>
                  </button>
                  {hasStoredDraft && (
                    <button
                      type="button"
                      onClick={loadSavedDraftFromStorage}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Restore last saved draft"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
                      <span>Load</span>
                    </button>
                  )}
                </div>
              </div>

              {savedDraftStatus && (
                <p className="text-xs font-semibold text-emerald-700 mb-2">
                  ✓ {savedDraftStatus}
                </p>
              )}

              {/* "COOL-OFF" DELAY PROMPT FOR HEATED MOMENTS */}
              {isHeatedMoment && !coolOffDismissed && (
                <div className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 p-3.5 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">🕊️</span>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-200 leading-relaxed">
                        Take a breath! Would you like to reframe this text using
                        &lsquo;I feel&rsquo; statements instead of &lsquo;You
                        always&rsquo; statements before sending?
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleReframeIFeelStatements}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer"
                        >
                          ✨ Yes, Reframe with &ldquo;I Feel&rdquo; Statements
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoolOffDismissed(true)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer"
                        >
                          Keep My Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Switcher: Type Text vs Record Voice Note */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    inputMode === "text"
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
                  }`}
                >
                  ✍️ Type Rough Draft
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("voice")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    inputMode === "voice"
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
                  }`}
                >
                  🎤 Record Voice Note (&ldquo;Rant-to-Email&rdquo;)
                </button>
              </div>

              {inputMode === "voice" ? (
                <div className="rounded-xl border-2 border-dashed border-teal-400 bg-teal-50/50 dark:bg-slate-800/60 p-6 text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isRecording
                      ? `🔴 Recording your voice rant (${recordingSeconds}s)... Speak naturally!`
                      : "Tap below to vent or explain what happened out loud. We will transcribe and polish it automatically!"}
                  </p>
                  <div className="flex justify-center">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="px-5 py-2.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Voice Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-pulse cursor-pointer"
                      >
                        <MicOff className="w-4 h-4" />
                        <span>Stop &amp; Polish My Voice Note</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={5}
                    value={roughDraft}
                    onChange={(e) => setRoughDraft(e.target.value)}
                    placeholder={currentPersonaConfig.placeholderHint}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Quick Preset Chips for Current Persona */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">
                  Quick Presets:
                </span>
                {currentPersonaConfig.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setRelationship(preset.relationship);
                      setSituation(preset.situation);
                      setCourseOrRefCode(preset.courseOrRef);
                      setRoughDraft(preset.draft);
                      handleGenerate({
                        draftOverride: preset.draft,
                        relationshipOverride: preset.relationship,
                        situationOverride: preset.situation,
                        courseOverride: preset.courseOrRef,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold cursor-pointer"
                  >
                    {preset.buttonLabel}
                  </button>
                ))}
              </div>

              {/* "OVERTHINKING SHIELD" LIVE TEXT ANALYZER */}
              {!simpleViewMode && (
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      Overthinking Shield (Live Text Radar)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {overthinkingMetrics.wordCount} words
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {overthinkingMetrics.clingyMessage}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {overthinkingMetrics.passiveAggressiveHits.length > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold border border-rose-300">
                        ⚠️ Passive-Aggression Alert: Flagged &ldquo;
                        {overthinkingMetrics.passiveAggressiveHits.join(", ")}
                        &rdquo;
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
                        🛡️ Passive-Aggression Radar: Clear
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold border ${
                        overthinkingMetrics.pressureScore > 50
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-sky-100 text-sky-900 border-sky-300"
                      }`}
                    >
                      ⏱️ Reply Pressure Meter:{" "}
                      {overthinkingMetrics.pressureScore > 50
                        ? `High (${overthinkingMetrics.pressureScore}% — Demands Urgent Reply)`
                        : "Low & Breathable"}
                    </span>
                  </div>
                </div>
              )}

              {/* GENERATE CTA BUTTON WITH KEYBOARD SHORTCUT BADGE */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate()}
                className={`mt-4 w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  persona === "school_kids"
                    ? "bg-pink-600 hover:bg-pink-700 border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]"
                    : "bg-teal-700 hover:bg-teal-800"
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Polishing Your Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {persona === "school_kids"
                        ? "🚀 Super-Polish My Message! (+1 Gold Star ⭐)"
                        : "Generate Polished Draft & Coaching"}
                    </span>
                    <kbd className="ml-1 px-2 py-0.5 text-[11px] font-mono bg-teal-900/70 text-teal-100 rounded border border-teal-400/40">
                      Ctrl+↵
                    </kbd>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STEP 3 (YOUR READY-TO-SEND MESSAGE, FORMATTER, SCORECARD & COACHING) */}
          <div className="lg:col-span-7 space-y-6">
            {/* GAMIFIED ETIQUETTE SCORE METER & INSTANT FEEDBACK ACHIEVEMENT BADGES */}
            <div
              className={`rounded-2xl p-5 border shadow-xs ${
                persona === "school_kids"
                  ? "bg-white border-4 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a]"
                  : "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🏆 Gamified Etiquette Score Meter &amp; Badges</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Color-coded progress rings: Green = Safe, Yellow = Review,
                    Red = Risky
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {analysis?.readiness_scorecard?.tone_warning_status ||
                    "Safe to Send 🟢"}
                </span>
              </div>

              {/* 3 Score Progress Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  {
                    title: "Politeness Score",
                    score: politenessScore,
                    delta:
                      analysis?.readiness_scorecard?.politeness_delta || "+50%",
                  },
                  {
                    title: "Clarity Score",
                    score: clarityScore,
                    delta:
                      analysis?.readiness_scorecard?.clarity_delta || "+34%",
                  },
                  {
                    title: "Raw Draft Before Polish",
                    score: rawScore,
                    delta: "Before AI Polish",
                  },
                ].map((metric) => {
                  const style = getScoreColorBadge(metric.score);
                  return (
                    <div
                      key={metric.title}
                      className={`rounded-xl border p-3 ${style.bg}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold">{metric.title}</span>
                        <span className="text-sm font-extrabold">
                          {metric.score}/100
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-slate-300/60">
                        <div
                          className={`h-full ${style.bar} transition-all duration-500`}
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
                        <span>{style.label}</span>
                        <span>{metric.delta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Achievement Badges Row */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  🎖️ Unlocked Communication Achievement Badges
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {achievementBadges.map((b) => (
                    <div
                      key={b.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        b.earned
                          ? "bg-teal-50/90 dark:bg-slate-800 border-teal-300 dark:border-teal-700 text-teal-950 dark:text-teal-200"
                          : "bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <span className="text-base">{b.icon}</span>
                        <span className="truncate">{b.label}</span>
                      </div>
                      <p className="text-[10px] mt-0.5 text-slate-600 dark:text-slate-400">
                        {b.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 3 CARD: READY-TO-SEND MESSAGE + OUTPUT FORMAT SELECTOR + PDF / AUDIO / COPY */}
            <div
              className={`rounded-2xl p-5 border shadow-xs space-y-4 ${
                persona === "school_kids"
                  ? "bg-white border-4 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a]"
                  : "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      Step 3: Your Ready-to-Send {platform}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Switch the layout format, listen out loud, copy, or export
                      as a PDF document.
                    </p>
                  </div>
                </div>

                {/* Top Quick Actions: Export PDF & Read Aloud Audio Player */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadFormattedPdf}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      exportedPdfSuccess
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 border-teal-300"
                    }`}
                    title="Export polished message as a formatted PDF (Ctrl+Shift+E)"
                  >
                    {exportedPdfSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>PDF Exported!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-teal-700" />
                        <span>📄 Export PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleReadAloud(
                        `${
                          platform === "Email" && analysis?.subject_line
                            ? `Subject: ${analysis.subject_line}. `
                            : ""
                        }${displayedEmailBody}`
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-amber-500 text-slate-950 border-amber-600"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border-slate-300"
                    }`}
                    title="Listen to how your polished message sounds out loud (Alt+R)"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>🔊 Read Aloud</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* OUTPUT TEXT FORMAT SELECTOR (6 Formats) */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    📐 Choose Output Text Format:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Instantly reformats your polished output below
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OUTPUT_TEXT_FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setOutputTextFormat(fmt.id);
                        setCustomEditedBody(null);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        outputTextFormat === fmt.id
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                          : "bg-white dark:bg-slate-900 hover:bg-teal-50/50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{fmt.label}</p>
                      <p
                        className={`text-[10px] truncate ${
                          outputTextFormat === fmt.id
                            ? "text-teal-100"
                            : "text-slate-500"
                        }`}
                      >
                        {fmt.shortDesc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Tone Version Tabs (Warm & Respectful, Concise & Direct, Simple & Clear) */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    {
                      id: "warm_respectful",
                      label: "💛 Warm & Respectful (Recommended)",
                    },
                    { id: "concise_direct", label: "⚡ Concise & Short" },
                    {
                      id: "simple_clear",
                      label: "📖 Super Simple (All Ages)",
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedVersionTab(tab.id);
                      setCustomEditedBody(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedVersionTab === tab.id
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subject Line Options (when Email is selected) */}
              {platform === "Email" &&
                Array.isArray(analysis?.subject_lines) && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      📌 Recommended Subject Lines (Click to Copy):
                    </p>
                    <div className="space-y-1.5">
                      {analysis.subject_lines.map(
                        (subj: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-teal-50/70 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 text-xs"
                          >
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {subj}
                            </span>
                            <button
                              type="button"
                              onClick={() => copySubject(subj, idx)}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedSubjectIdx === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Editable Final Polished Message Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ✏️ Polished Message (You can edit any word below before
                    copying or exporting):
                  </label>
                  {customEditedBody !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomEditedBody(null)}
                      className="text-[11px] font-semibold text-teal-700 underline cursor-pointer"
                    >
                      Reset edits
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={displayedEmailBody}
                  onChange={(e) => setCustomEditedBody(e.target.value)}
                  className="w-full rounded-xl border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-950 p-4 text-sm leading-relaxed font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Main Output Action Bar: Copy, Export PDF, Download .TXT */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyMainOutput}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedMain ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied Ready-to-Send Message!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Message</span>
                        <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-teal-900 text-teal-100 rounded">
                          Ctrl+Shift+C
                        </kbd>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadFormattedPdf}
                    className="px-3.5 py-2.5 rounded-xl border border-teal-300 dark:border-slate-700 bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadTxtFile(
                        "SayItRight_Message.txt",
                        `${
                          platform === "Email" && analysis?.subject_line
                            ? `Subject: ${analysis.subject_line}\n\n`
                            : ""
                        }${displayedEmailBody}`
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .TXT</span>
                  </button>
                </div>

                {/* Clickable Glossary Word Helper Pills */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Explain word:
                  </span>
                  {Object.keys(SIMPLE_WORD_GLOSSARY)
                    .slice(0, 4)
                    .map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => setExternalWordTrigger(word)}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-[11px] font-semibold text-teal-800 dark:text-teal-300 border border-slate-300 cursor-pointer"
                      >
                        {word}?
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* INTERACTIVE "BEFORE & AFTER" HIGHLIGHTING WITH HOVER/TAP EXPLANATION TOOLTIPS */}
            {Array.isArray(analysis?.before_after_highlights) &&
              analysis.before_after_highlights.length > 0 && (
                <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        🔍 Interactive &ldquo;Before &amp; After&rdquo; Phrase
                        Highlighting
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hover or tap any 🟢 Green upgraded phrase to see a
                        pop-up explaining why the change makes your message
                        stronger!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analysis.before_after_highlights.map(
                      (
                        item: {
                          original_red: string;
                          polished_green: string;
                          reason: string;
                        },
                        idx: number
                      ) => {
                        const isTooltipOpen = activeHighlightTooltip === idx;
                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setActiveHighlightTooltip(idx)}
                            onClick={() =>
                              setActiveHighlightTooltip(
                                isTooltipOpen ? null : idx
                              )
                            }
                            className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50/70 dark:bg-slate-800/60 transition-all cursor-pointer"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* RED BEFORE */}
                              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5">
                                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-950 mb-1">
                                  🔴 Before (Raw Draft)
                                </span>
                                <p className="text-xs text-rose-950 dark:text-rose-200 line-through">
                                  {item.original_red}
                                </p>
                              </div>

                              {/* GREEN AFTER */}
                              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2.5 relative">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-950">
                                    🟢 After (Polished Upgrade)
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 underline">
                                    Why this works 💡
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                                  {item.polished_green}
                                </p>
                              </div>
                            </div>

                            {/* Explanation Tooltip Banner */}
                            {isTooltipOpen && (
                              <div className="mt-2.5 rounded-lg bg-slate-900 text-white px-3 py-2 text-xs flex items-center gap-2">
                                <span>💡</span>
                                <span>
                                  <strong>Coach Explanation:</strong>{" "}
                                  {item.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* INTERACTIVE RECIPIENT / PARTNER REACTION SIMULATOR */}
            <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <span>
                      Interactive Recipient &amp; Partner Reaction Simulator
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview how your recipient or partner is likely to interpret
                    and reply to your message before you hit send.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateReaction}
                  disabled={isSimulatingReaction}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>
                    {isSimulatingReaction
                      ? "Simulating..."
                      : "🧪 Refresh Reaction Forecast"}
                  </span>
                </button>
              </div>

              {showReactionPanel && analysis?.professor_reactions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3">
                    <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 mb-1">
                      🟢 Outcome A (Reassured / Likely Reply)
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 mb-1.5">
                      &ldquo;Felt heard, respected, and appreciated.&rdquo;
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic">
                      &ldquo;{analysis.professor_reactions.likely_reply}&rdquo;
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-xs font-extrabold text-amber-900 dark:text-amber-300 mb-1">
                      🟡 Outcome B (Clarifying / Follow-Up)
                    </p>
                    <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 mb-1.5">
                      &ldquo;Wants one extra detail or quick confirmation.&rdquo;
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic">
                      &ldquo;{analysis.professor_reactions.followup_question}
                      &rdquo;
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3">
                    <p className="text-xs font-extrabold text-rose-900 dark:text-rose-300 mb-1">
                      🔴 Outcome C (Guarded / Boundary)
                    </p>
                    <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-200 mb-1.5">
                      &ldquo;If sent raw without warm framing first:&rdquo;
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic">
                      &ldquo;{analysis.professor_reactions.worst_case_boundary}
                      &rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK "SAFETY CHECKLIST" BEFORE SENDING */}
            <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  <span>✅ Quick &ldquo;Safety Checklist&rdquo; Before Sending</span>
                </h3>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {
                    Object.values(safetyChecklist).filter(Boolean).length
                  }
                  /3 Checked
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: "replacedBrackets" as const,
                    label:
                      "Did you replace bracketed details like [Your Name] and [Course ID]?",
                  },
                  {
                    key: "officialSenderEmail" as const,
                    label:
                      "Is your official school/university email (or right chat contact) selected as the sender?",
                  },
                  {
                    key: "attachedDocuments" as const,
                    label:
                      "Did you attach any required documents (e.g., doctor's note, clinic receipt, or screenshot)?",
                  },
                ].map((item) => {
                  const checked = safetyChecklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setSafetyChecklist((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        checked
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-semibold ${
                          checked ? "line-through opacity-80" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CUTE ROBO CHATBOT ("BIBO") FLOATING HELPER */}
      <CuteRoboChatbot
        persona={persona}
        currentDraft={roughDraft}
        polishedEmail={displayedEmailBody}
        externalWordTrigger={externalWordTrigger}
        onClearExternalTrigger={() => setExternalWordTrigger(null)}
      />
    </div>
  );
}
