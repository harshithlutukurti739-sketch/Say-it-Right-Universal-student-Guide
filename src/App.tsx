/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  BookOpen,
  AlertTriangle,
  Download,
  RefreshCw,
  GraduationCap,
  HeartHandshake,
  Smile,
  ShieldCheck,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Globe,
  Type as TypeIcon,
  MessageSquare,
  Mail,
  Hash,
  FlaskConical,
  Sparkles,
  Pin,
  ArrowRight,
  Trash2,
  Upload,
  UserCheck,
  Save,
  RotateCcw,
  MessageCircleHeart,
  FileText,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  buildFallbackResponse,
  SIMPLE_WORD_GLOSSARY,
  detectInputLanguage,
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
          "hey bestie, i know we both got super busy this month and barely talked, i really miss hanging out with you and wanted to check in and plan a coffee catch-up this weekend!",
      },
      {
        id: "partner_misunderstanding",
        buttonLabel: "❤️ Clear Up Misunderstanding with Partner",
        relationship: "Romantic Partner / Lover",
        situation: "Clearing Up a Misunderstanding / Honest Talk",
        courseOrRef: "Heart-to-Heart",
        draft:
          "i felt really hurt last night when we argued over text and you stopped replying. i care about us a lot and don't want us to stay mad—can we talk warmly tonight?",
      },
      {
        id: "hinglish_bestie",
        buttonLabel: "✨ Hinglish Chat with Close Friend",
        relationship: "Close Friend",
        situation: "General",
        courseOrRef: "Weekend Trip Plan",
        draft:
          "yaar kal main dinner pe nahi aa paunga kyunki ghar pe thoda zaroori kaam aa gaya hai, please bura mat manna hum Sunday ko pakka milte hain!",
      },
    ],
  },
};

interface EtiquetteLesson {
  principle: string;
  before_snippet: string;
  after_snippet: string;
  why_it_works: string;
  simple_kid_friendly_tip: string;
}

interface ToneFlag {
  type: string;
  severity: string;
  flagged_phrase: string;
  issue_explanation: string;
  suggested_fix: string;
}

interface BeforeAfterHighlight {
  original_red: string;
  polished_green: string;
  reason: string;
}

interface ProfessorReactions {
  likely_reply: string;
  followup_question: string;
  worst_case_boundary: string;
}

interface AnalysisResult {
  transcribed_text?: string;
  subject_line: string;
  subject_lines: string[];
  polished_email: string;
  platform_used?: string;
  tone_used?: string;
  readiness_scorecard: {
    raw_professionalism_score: number;
    raw_professionalism_label: string;
    clarity_score: number;
    clarity_delta: string;
    politeness_score: number;
    politeness_delta: string;
    tone_warning_status: string;
  };
  before_after_highlights: BeforeAfterHighlight[];
  versions: {
    warm_respectful: string;
    concise_direct: string;
    simple_clear: string;
  };
  etiquette_lessons: EtiquetteLesson[];
  tone_analysis: {
    overall_tone_summary: string;
    warmth_score: number;
    clarity_score: number;
    assertiveness_score: number;
    respect_score: number;
    flags: ToneFlag[];
    missing_details_checklist: string[];
    apology_audit: {
      unnecessary_apologies_found: number;
      coaching_note: string;
    };
  };
  professor_reactions: ProfessorReactions;
  using_fallback?: boolean;
}

function calculateLiveRawProfessionalism(draft: string): {
  score: number;
  casualHits: number;
  statusLabel: string;
} {
  const trimmed = draft.trim();
  if (!trimmed) {
    return { score: 0, casualHits: 0, statusLabel: "Waiting for input..." };
  }
  const lower = trimmed.toLowerCase();
  const redFlagWords = [
    "hey",
    "prof",
    "literally",
    "freaking",
    "sucks",
    "unfair",
    "asap",
    "whatever",
    "sorry",
    "my bad",
    "idk",
    "pls",
    "u ",
    "stupid",
  ];
  let hits = 0;
  for (const w of redFlagWords) {
    if (lower.includes(w)) hits++;
  }
  const hasGreeting =
    lower.startsWith("dear") ||
    lower.startsWith("hello professor") ||
    lower.startsWith("good morning");
  const base = hasGreeting ? 84 : 74;
  const score = Math.max(18, Math.min(92, base - hits * 11));
  const statusLabel =
    score < 50
      ? "High Red-Flag Risk (Too Casual / Reactive)"
      : score < 75
      ? "Needs Refinement before sending"
      : "Solid Foundation";
  return { score, casualHits: hits, statusLabel };
}

export default function App() {
  const [persona, setPersona] = useState<PersonaId>("college_student");
  const currentPersona = PERSONA_CONFIGS[persona];

  // Sidebar Controls
  const [relationship, setRelationship] = useState<string>(
    currentPersona.presets[0].relationship
  );
  const [situation, setSituation] = useState<string>(
    currentPersona.presets[0].situation
  );
  const [toneStyle, setToneStyle] = useState<ToneOption>("Polite & Direct");
  const [writerMood, setWriterMood] =
    useState<WriterMoodOption>("Anxious / Stressed");
  const [platform, setPlatform] = useState<PlatformOption>("Email");
  const [courseOrRefCode, setCourseOrRefCode] = useState<string>(
    currentPersona.presets[0].courseOrRef
  );
  const [studentName, setStudentName] = useState<string>("");
  const [professorName, setProfessorName] = useState<string>("");
  const [roughDraft, setRoughDraft] = useState<string>(
    currentPersona.presets[0].draft
  );

  // Inclusive Boosters
  const [apologyStripper, setApologyStripper] = useState<boolean>(true);
  const [simplifyLanguage, setSimplifyLanguage] = useState<boolean>(false);
  const [seniorLargeText, setSeniorLargeText] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>(
    "Auto-Detect (Match Input Language)"
  );

  // Input Mode: "✍️ Type Text" | "🎤 Record Voice Note"
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string>("");
  const [recordedAudioMime, setRecordedAudioMime] =
    useState<string>("audio/webm");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Interactive "Do's & Don'ts" Accordion state
  const [etiquetteTipsOpen, setEtiquetteTipsOpen] = useState<boolean>(false);

  // Easy View vs Detailed View toggle so any age person (kids, seniors, students) can read the page without overwhelm
  const [easySimpleLayout, setEasySimpleLayout] = useState<boolean>(false);
  const [showAdvancedComparison, setShowAdvancedComparison] =
    useState<boolean>(false);

  // Cartoon Kids Zone interactive state (stars, mascot speech bubble, active sticker)
  const [kidStarsCount, setKidStarsCount] = useState<number>(5);
  const [kidMascotBubble, setKidMascotBubble] = useState<string>(
    "Hi Super Kid! I'm Captain Pencil ✏️ and this is Professor Hoot 🦉! Tap any colorful adventure or magic word below to earn Gold Stars! ⭐"
  );
  const [kidSelectedSticker, setKidSelectedSticker] = useState<string>("uh_oh");

  // 2. "Anxiety-Buster" Calming Pastel Palette, Soothing Sound & Celebration Animations (st.balloons / st.snow / confetti)
  const [calmingTheme, setCalmingTheme] = useState<
    "soft_blue" | "mint_green" | "warm_purple" | "cartoon_sunny"
  >("soft_blue");
  const [anxietySoundEnabled, setAnxietySoundEnabled] = useState<boolean>(true);
  const [celebrationEffect, setCelebrationEffect] = useState<
    "balloons" | "snow" | "confetti" | null
  >(null);
  const [preferredCelebration, setPreferredCelebration] = useState<
    "balloons" | "snow" | "confetti"
  >("balloons");

  // 4. Interactive "Before & After" Highlighting active tooltip index
  const [activeHighlightTooltip, setActiveHighlightTooltip] = useState<
    number | null
  >(0);

  // 5. "Read Aloud" Audio Player playback speed
  const [readAloudSpeed, setReadAloudSpeed] = useState<number>(0.98);

  // 6. Quick "Safety Checklist" Before Sending (3 core pre-flight checks right below final draft)
  const [safetyChecklist, setSafetyChecklist] = useState<{
    replacedBrackets: boolean;
    officialEmailSelected: boolean;
    attachedDocuments: boolean;
  }>({
    replacedBrackets: false,
    officialEmailSelected: false,
    attachedDocuments: false,
  });

  // NEW: Vibe Check & Intent Selector, Subtle Emoji Enhancer, and Cool-Off Breathing state
  const [selectedVibeId, setSelectedVibeId] = useState<string>("flirty_playful");
  const [subtleEmojiEnhancer, setSubtleEmojiEnhancer] = useState<boolean>(true);
  const [coolOffBreathingSec, setCoolOffBreathingSec] = useState<number>(0);

  const handleSelectVibeCheck = (vibe: VibeCheckItem) => {
    setSelectedVibeId(vibe.id);
    setPersona("friendly_chat");
    setRelationship(vibe.relationship);
    setSituation(vibe.situation);
    setWriterMood(vibe.mood);
    setPlatform("WhatsApp / Text Message");
    setRoughDraft(vibe.sampleDraft);
    setCustomEditedOutput(vibe.vibePreview);
    playAnxietyBusterChime();
    handleGenerate({
      draftOverride: vibe.sampleDraft,
      personaOverride: "friendly_chat",
      relOverride: vibe.relationship,
      sitOverride: vibe.situation,
      moodOverride: vibe.mood,
      platformOverride: "WhatsApp / Text Message",
    });
  };

  const handleReframeWithIFeel = () => {
    const reframed = roughDraft
      .replace(/\byou always\b/gi, "I feel hurt when")
      .replace(/\byou never\b/gi, "I really value when we")
      .replace(/\byour fault\b/gi, "a tough misunderstanding for both of us")
      .replace(/\bfine,?\s*whatever\b/gi, "I need a little time to process this")
      .replace(/\bk\.\b/gi, "Got it, let's talk when we're both free.");

    const finalReframe =
      reframed === roughDraft
        ? `I feel a bit overwhelmed right now and I really care about our connection. Could we talk this through calmly when we're both free? 💛`
        : `${reframed} (Sharing how I feel because I really care about us 💛)`;

    setRoughDraft(finalReframe);
    setWriterMood("Calm / Neutral");
    playAnxietyBusterChime();
    handleGenerate({
      draftOverride: finalReframe,
      moodOverride: "Calm / Neutral",
    });
  };

  const startCoolOffBreathing = () => {
    setCoolOffBreathingSec(5);
    const interval = setInterval(() => {
      setCoolOffBreathingSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Web Audio API soothing "Anxiety-Buster" chime (no external audio files needed)
  const playAnxietyBusterChime = () => {
    if (!anxietySoundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5 calming major triad
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(
          0.07,
          ctx.currentTime + idx * 0.09 + 0.04
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + idx * 0.09 + 0.55
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.6);
      });
    } catch (_e) {
      // Ignore if browser blocks autoplay audio
    }
  };

  const triggerCelebration = (
    type: "balloons" | "snow" | "confetti" = preferredCelebration
  ) => {
    setCelebrationEffect(type);
    playAnxietyBusterChime();
    setTimeout(() => {
      setCelebrationEffect((curr) => (curr === type ? null : curr));
    }, 3900);
  };

  const handleAddKidMagicPhrase = (phrase: string, cheerText: string) => {
    setRoughDraft((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${phrase}` : phrase;
    });
    setKidStarsCount((prev) => prev + 1);
    setKidMascotBubble(cheerText);
    playAnxietyBusterChime();
  };

  // Output Tabs & Variants
  const [activeOutputTab, setActiveOutputTab] = useState<
    "tab1" | "tab2" | "tab3"
  >("tab1");
  const [selectedVariant, setSelectedVariant] = useState<
    "warm_respectful" | "concise_direct" | "simple_clear"
  >("warm_respectful");
  const [outputTextFormat, setOutputTextFormat] = useState<OutputTextFormat>(
    "standard_paragraphs"
  );
  const [isEditingOutput, setIsEditingOutput] = useState<boolean>(false);
  const [customEditedOutput, setCustomEditedOutput] = useState<string | null>(
    null
  );
  const [comparisonViewMode, setComparisonViewMode] = useState<
    "side_by_side" | "slider_split"
  >("side_by_side");
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Professor Response Simulator state
  const [showReactionSimulator, setShowReactionSimulator] =
    useState<boolean>(false);
  const [isSimulatingReaction, setIsSimulatingReaction] =
    useState<boolean>(false);
  const [simulatedReactions, setSimulatedReactions] =
    useState<ProfessorReactions | null>(null);

  // Interactive Checklist state
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Copy & Audio states
  const [copiedSubjectIdx, setCopiedSubjectIdx] = useState<number | null>(null);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Cute Robo Chatbot Word Trigger
  const [roboWordTrigger, setRoboWordTrigger] = useState<string | null>(null);

  // LocalStorage Draft & Persona Persistence states
  const STORAGE_KEY = "say_it_right_saved_draft_v1";
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem("say_it_right_saved_draft_v1"));
    } catch {
      return false;
    }
  });
  const [draftStorageFeedback, setDraftStorageFeedback] = useState<
    string | null
  >(null);

  const handleSaveDraftToStorage = () => {
    try {
      const payload = {
        roughDraft,
        persona,
        relationship,
        situation,
        toneStyle,
        writerMood,
        platform,
        courseOrRefCode,
        professorName,
        studentName,
        apologyStripper,
        simplifyLanguage,
        targetLanguage,
        seniorLargeText,
        savedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setHasSavedDraft(true);
      setDraftStorageFeedback(`Draft & settings saved (${payload.savedAt})`);
      setTimeout(() => setDraftStorageFeedback(null), 3500);
    } catch {
      setDraftStorageFeedback("Could not save to browser storage");
      setTimeout(() => setDraftStorageFeedback(null), 3500);
    }
  };

  const handleLoadLastDraftFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setDraftStorageFeedback("No saved draft found yet");
        setTimeout(() => setDraftStorageFeedback(null), 3500);
        return;
      }
      const parsed = JSON.parse(raw);
      const nextPersona: PersonaId = parsed.persona || persona;
      const nextDraft: string =
        parsed.roughDraft !== undefined ? parsed.roughDraft : roughDraft;
      const nextRel: string = parsed.relationship || relationship;
      const nextSit: string = parsed.situation || situation;
      const nextTone: ToneOption = parsed.toneStyle || toneStyle;
      const nextMood: WriterMoodOption = parsed.writerMood || writerMood;
      const nextPlatform: PlatformOption = parsed.platform || platform;
      const nextRef: string =
        parsed.courseOrRefCode !== undefined
          ? parsed.courseOrRefCode
          : courseOrRefCode;
      const nextApology: boolean =
        parsed.apologyStripper !== undefined
          ? Boolean(parsed.apologyStripper)
          : apologyStripper;
      const nextSimplify: boolean =
        parsed.simplifyLanguage !== undefined
          ? Boolean(parsed.simplifyLanguage)
          : simplifyLanguage;
      const nextLang: string = parsed.targetLanguage || targetLanguage;

      setPersona(nextPersona);
      setRoughDraft(nextDraft);
      setRelationship(nextRel);
      setSituation(nextSit);
      setToneStyle(nextTone);
      setWriterMood(nextMood);
      setPlatform(nextPlatform);
      setCourseOrRefCode(nextRef);
      if (parsed.professorName !== undefined) {
        setProfessorName(parsed.professorName);
      }
      if (parsed.studentName !== undefined) {
        setStudentName(parsed.studentName);
      }
      setApologyStripper(nextApology);
      setSimplifyLanguage(nextSimplify);
      setTargetLanguage(nextLang);
      if (parsed.seniorLargeText !== undefined) {
        setSeniorLargeText(Boolean(parsed.seniorLargeText));
      }

      setDraftStorageFeedback(
        `Loaded saved draft${parsed.savedAt ? ` from ${parsed.savedAt}` : ""}`
      );
      setTimeout(() => setDraftStorageFeedback(null), 3500);

      handleGenerate({
        draftOverride: nextDraft,
        personaOverride: nextPersona,
        relOverride: nextRel,
        sitOverride: nextSit,
        toneOverride: nextTone,
        moodOverride: nextMood,
        platformOverride: nextPlatform,
        apologyOverride: nextApology,
        simplifyOverride: nextSimplify,
        langOverride: nextLang,
        refOverride: nextRef,
      });
    } catch {
      setDraftStorageFeedback("Could not load saved draft");
      setTimeout(() => setDraftStorageFeedback(null), 3500);
    }
  };

  const handleSelectPersona = (newPersona: PersonaId) => {
    setPersona(newPersona);
    const cfg = PERSONA_CONFIGS[newPersona];
    const firstPreset = cfg.presets[0];
    setRelationship(firstPreset.relationship);
    setSituation(firstPreset.situation);
    setCourseOrRefCode(firstPreset.courseOrRef);
    setRoughDraft(firstPreset.draft);
    const useApology =
      newPersona === "women_advocacy" || newPersona === "college_student";
    const useSimple =
      newPersona === "seniors" || newPersona === "school_kids";
    const nextPlat: PlatformOption =
      newPersona === "friendly_chat" ? "WhatsApp / Text Message" : platform;
    if (newPersona === "friendly_chat") {
      setPlatform("WhatsApp / Text Message");
    }
    setApologyStripper(useApology);
    setSimplifyLanguage(useSimple);
    if (newPersona === "seniors") {
      setSeniorLargeText(true);
    }
    handleGenerate({
      draftOverride: firstPreset.draft,
      personaOverride: newPersona,
      relOverride: firstPreset.relationship,
      sitOverride: firstPreset.situation,
      platformOverride: nextPlat,
      apologyOverride: useApology,
      simplifyOverride: useSimple,
      refOverride: firstPreset.courseOrRef,
    });
  };

  // Run initial analysis on first mount
  useEffect(() => {
    const firstPreset = PERSONA_CONFIGS.college_student.presets[0];
    handleGenerate({
      draftOverride: firstPreset.draft,
      personaOverride: "college_student",
      relOverride: firstPreset.relationship,
      sitOverride: firstPreset.situation,
      toneOverride: "Polite & Direct",
      platformOverride: "Email",
      refOverride: firstPreset.courseOrRef,
    });
  }, []);

  const handleGenerate = async (overrides?: {
    draftOverride?: string;
    personaOverride?: PersonaId;
    relOverride?: string;
    sitOverride?: string;
    toneOverride?: ToneOption;
    moodOverride?: WriterMoodOption;
    platformOverride?: PlatformOption;
    apologyOverride?: boolean;
    simplifyOverride?: boolean;
    langOverride?: string;
    refOverride?: string;
    audioBase64Override?: string;
  }) => {
    const textToAnalyze =
      overrides?.draftOverride !== undefined
        ? overrides.draftOverride
        : roughDraft;
    const audioToAnalyze =
      overrides?.audioBase64Override !== undefined
        ? overrides.audioBase64Override
        : recordedAudioBase64;

    if (!textToAnalyze.trim() && !audioToAnalyze) {
      setErrorMsg(
        "Please type your rough thoughts, click a Quick-Fill Preset in the sidebar, or record a voice note first."
      );
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setCheckedItems({});
    setShowReactionSimulator(false);
    setCustomEditedOutput(null);
    setIsEditingOutput(false);

    const activePersona = overrides?.personaOverride || persona;
    const activePersonaCfg = PERSONA_CONFIGS[activePersona];
    const activeTone = overrides?.toneOverride || toneStyle;
    const activeMood = overrides?.moodOverride || writerMood;
    const activePlatform = overrides?.platformOverride || platform;
    const activeRel =
      overrides?.relOverride !== undefined
        ? overrides.relOverride
        : relationship;
    const activeSit =
      overrides?.sitOverride !== undefined ? overrides.sitOverride : situation;
    const activeApology =
      overrides?.apologyOverride !== undefined
        ? overrides.apologyOverride
        : apologyStripper;
    const activeSimplify =
      overrides?.simplifyOverride !== undefined
        ? overrides.simplifyOverride
        : simplifyLanguage;
    const activeLangRaw =
      overrides?.langOverride !== undefined
        ? overrides.langOverride
        : targetLanguage;
    const autoDetected = detectInputLanguage(textToAnalyze);
    const activeLang =
      activeLangRaw.startsWith("Auto-Detect")
        ? autoDetected.matchedLanguageOption
        : activeLangRaw;
    const activeRef =
      overrides?.refOverride !== undefined
        ? overrides.refOverride
        : courseOrRefCode;

    const fallbackData: AnalysisResult = buildFallbackResponse({
      roughDraft: textToAnalyze,
      persona: activePersona,
      relationship: activeRel,
      situation: activeSit,
      toneStyle: activeTone,
      writerMood: activeMood,
      platform: activePlatform,
      apologyStripper: activeApology,
      simplifyLanguage: activeSimplify,
      targetLanguage: activeLang,
      courseOrRefCode: activeRef,
      studentName,
      professorName,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          roughDraft: textToAnalyze,
          persona: activePersona,
          personaLabel: activePersonaCfg.fullTitle,
          relationship: activeRel,
          situation: activeSit,
          toneStyle: activeTone,
          writerMood: activeMood,
          platform: activePlatform,
          apologyStripper: activeApology,
          simplifyLanguage: activeSimplify,
          targetLanguage: activeLang,
          courseOrRefCode: activeRef,
          studentName,
          professorName,
          audioBase64: audioToAnalyze,
          audioMimeType: recordedAudioMime,
        }),
      });

      clearTimeout(timeoutId);

      let parsedData: AnalysisResult | null = null;
      if (response.ok) {
        const rawText = await response.text();
        try {
          parsedData = JSON.parse(rawText);
        } catch (_jsonErr) {
          parsedData = null;
        }
      }

      const finalResult: AnalysisResult =
        parsedData && parsedData.polished_email
          ? { ...fallbackData, ...parsedData }
          : fallbackData;

      setAnalysis(finalResult);
      setSimulatedReactions(
        finalResult.professor_reactions || fallbackData.professor_reactions
      );
      if (finalResult.transcribed_text && audioToAnalyze) {
        setRoughDraft(finalResult.transcribed_text);
      }
      setSelectedVariant(activeSimplify ? "simple_clear" : "warm_respectful");
    } catch (_err: any) {
      // Never crash or display an error banner — fall back cleanly to static structured coaching data
      setAnalysis(fallbackData);
      setSimulatedReactions(fallbackData.professor_reactions);
      setSelectedVariant(activeSimplify ? "simple_clear" : "warm_respectful");
    } finally {
      setIsLoading(false);
    }
  };

  // Load a sidebar Quick-Fill Preset
  const handleLoadPreset = (preset: PresetScenario) => {
    setRelationship(preset.relationship);
    setSituation(preset.situation);
    setCourseOrRefCode(preset.courseOrRef);
    setRoughDraft(preset.draft);
    handleGenerate({
      draftOverride: preset.draft,
      personaOverride: persona,
      relOverride: preset.relationship,
      sitOverride: preset.situation,
      toneOverride: toneStyle,
      platformOverride: platform,
      refOverride: preset.courseOrRef,
    });
  };

  // Native Voice Note Recorder ("Rant-to-Email" Multimodal Audio + Live Speech-to-Text simultaneously)
  const startAudioRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        setRecordedAudioMime(mimeType);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string)?.split(",")[1] || "";
          setRecordedAudioBase64(base64String);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);

      // Also start browser SpeechRecognition in parallel if supported so the user sees live words appear
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.onresult = (event: any) => {
          const lastIdx = event.results.length - 1;
          const transcript = event.results[lastIdx]?.[0]?.transcript;
          if (transcript) {
            setRoughDraft((prev) =>
              prev.trim() ? `${prev.trim()} ${transcript}` : transcript
            );
          }
        };
        speechRecRef.current = recognition;
        try {
          recognition.start();
        } catch (_e) {}
      }
    } catch (_err) {
      setErrorMsg(
        "Microphone access wasn't granted in this tab. You can upload an audio file or click 'Load Sample Rant' below to test Rant-to-Email immediately."
      );
    }
  };

  const stopAudioRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch (_e) {}
    }
    setIsRecordingAudio(false);
  };

  // Upload an audio file (.wav, .mp3, .m4a, .webm) for Rant-to-Email
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRecordedAudioUrl(url);
    setRecordedAudioMime(file.type || "audio/wav");

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string)?.split(",")[1] || "";
      setRecordedAudioBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const loadSampleRantAudioTranscript = () => {
    const sampleRant =
      "Prof, I'm super overwhelmed right now, my car broke down on the highway this morning and I can't make the 9 AM group presentation! I have all my slides ready and the tow truck receipt, please don't fail me!";
    setRoughDraft(sampleRant);
    handleGenerate({
      draftOverride: sampleRant,
    });
  };

  // Predict Professor's Reaction Button handler
  const handlePredictReaction = async () => {
    if (!analysis) return;
    setShowReactionSimulator(true);

    const defaultReactions: ProfessorReactions =
      analysis.professor_reactions || {
        likely_reply:
          "Sure, thank you for letting me know ahead of time and proposing a clear plan. You may submit by Friday at midnight without penalty.",
        followup_question:
          "Thanks for reaching out. Please provide a doctor's note or official documentation and confirm which class section you attend.",
        worst_case_boundary:
          "Please consult the syllabus regarding missed deadlines. Extensions require prior documentation verified through Student Services.",
      };

    setIsSimulatingReaction(true);
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
        const rawText = await res.text();
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.likely_reply) {
            setSimulatedReactions(parsed);
            return;
          }
        } catch (_jsonErr) {}
      }
      setSimulatedReactions(defaultReactions);
    } catch (_e) {
      setSimulatedReactions(defaultReactions);
    } finally {
      setIsSimulatingReaction(false);
    }
  };

  // Copy & Download helpers
  const [exportedPdfSuccess, setExportedPdfSuccess] = useState<boolean>(false);

  const copySubject = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectIdx(idx);
    setTimeout(() => setCopiedSubjectIdx(null), 2000);
  };

  const copyBodyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Download .txt file
  const downloadTxtFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
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
      .replace(/\u2026/g, "...")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };

  // Export Polished Message as a Professionally Formatted PDF Document
  const downloadFormattedPdf = () => {
    if (!analysis) return;

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
      let cursorY = 16;

      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - 18) {
          doc.addPage();
          cursorY = 18;
        }
      };

      // 1. Top Branded Header Banner
      doc.setFillColor(15, 118, 110); // Teal-700
      doc.roundedRect(margin, cursorY, contentWidth, 24, 3, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        "SAY IT RIGHT - POLISHED COMMUNICATION DOCUMENT",
        margin + 6,
        cursorY + 9.5
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(
        toPdfSafeText(
          `Prepared on ${dateStr}  |  Mode: ${currentPersonaConfig.shortLabel}  |  Format: ${
            OUTPUT_TEXT_FORMAT_OPTIONS.find((f) => f.id === outputTextFormat)
              ?.label || "Standard"
          }`
        ),
        margin + 6,
        cursorY + 17.5
      );

      cursorY += 30;

      // 2. Context & Etiquette Score Metadata Grid
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.roundedRect(margin, cursorY, contentWidth, 26, 2, 2, "FD");

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("RECIPIENT & CONTEXT", margin + 5, cursorY + 6.5);
      doc.text("ETIQUETTE & TONE SCORECARD", margin + contentWidth / 2 + 4, cursorY + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        toPdfSafeText(`Recipient: ${relationship}`),
        margin + 5,
        cursorY + 12.5
      );
      doc.text(
        toPdfSafeText(`Situation: ${situation}`),
        margin + 5,
        cursorY + 17.5
      );
      doc.text(
        toPdfSafeText(
          `Channel: ${platform}${
            courseOrRefCode ? `  |  Ref: ${courseOrRefCode}` : ""
          }`
        ),
        margin + 5,
        cursorY + 22.5
      );

      const pScore = analysis.readiness_scorecard?.politeness_score ?? 94;
      const cScore = analysis.readiness_scorecard?.clarity_score ?? 92;
      doc.text(
        toPdfSafeText(
          `Politeness Score: ${pScore}/100  |  Clarity Score: ${cScore}/100`
        ),
        margin + contentWidth / 2 + 4,
        cursorY + 12.5
      );
      doc.text(
        toPdfSafeText(
          `Tone Style: ${toneStyle}  |  Mood: ${writerMood}`
        ),
        margin + contentWidth / 2 + 4,
        cursorY + 17.5
      );
      doc.text(
        toPdfSafeText(`Output Language: ${outputLanguage}`),
        margin + contentWidth / 2 + 4,
        cursorY + 22.5
      );

      cursorY += 32;

      // 3. Subject Line Block (if Email or subject exists)
      if (analysis.subject_line) {
        const cleanSubject = toPdfSafeText(analysis.subject_line);
        const subjLines = doc.splitTextToSize(
          `Subject: ${cleanSubject}`,
          contentWidth - 10
        );
        const subjBoxHeight = Math.max(12, subjLines.length * 5 + 6);

        checkPageBreak(subjBoxHeight + 6);
        doc.setFillColor(240, 253, 250); // Teal-50
        doc.setDrawColor(153, 246, 228); // Teal-200
        doc.roundedRect(margin, cursorY, contentWidth, subjBoxHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 118, 110);
        doc.text(subjLines, margin + 5, cursorY + 7.5);

        cursorY += subjBoxHeight + 6;
      }

      // 4. Polished Message Section Header
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(
        platform === "Email"
          ? "POLISHED READY-TO-SEND EMAIL"
          : "POLISHED READY-TO-SEND MESSAGE",
        margin,
        cursorY
      );
      cursorY += 4;

      // 5. Polished Message Body Box
      const cleanBodyText = toPdfSafeText(displayedEmailBody);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const bodyLines: string[] = doc.splitTextToSize(
        cleanBodyText || "No message content available.",
        contentWidth - 12
      );

      const lineHeight = 5.6;
      const bodyBoxPadding = 8;

      // Render paragraphs across pages if needed
      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(255, 255, 255);

      let lineIdx = 0;
      while (lineIdx < bodyLines.length) {
        const availableSpace = pageHeight - 24 - cursorY;
        const maxLinesThisPage = Math.max(
          1,
          Math.floor((availableSpace - bodyBoxPadding * 2) / lineHeight)
        );
        const chunk = bodyLines.slice(lineIdx, lineIdx + maxLinesThisPage);
        const boxHeight = chunk.length * lineHeight + bodyBoxPadding * 2;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 2, 2, "FD");

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(chunk, margin + 6, cursorY + bodyBoxPadding + 3);

        cursorY += boxHeight + 8;
        lineIdx += maxLinesThisPage;

        if (lineIdx < bodyLines.length) {
          doc.addPage();
          cursorY = 18;
        }
      }

      // 6. Key Phrase Upgrades (Before & After Highlights)
      if (analysis.sentence_upgrades && analysis.sentence_upgrades.length > 0) {
        checkPageBreak(36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("KEY TONE & ETIQUETTE UPGRADES", margin, cursorY);
        cursorY += 5;

        analysis.sentence_upgrades.slice(0, 3).forEach((upg, idx) => {
          const beforeLines = doc.splitTextToSize(
            `Before: "${toPdfSafeText(upg.before_phrase)}"`,
            contentWidth - 10
          );
          const afterLines = doc.splitTextToSize(
            `After:  "${toPdfSafeText(upg.after_phrase)}"`,
            contentWidth - 10
          );
          const whyLines = doc.splitTextToSize(
            `Why:    ${toPdfSafeText(upg.why_it_works)}`,
            contentWidth - 10
          );
          const itemHeight =
            (beforeLines.length + afterLines.length + whyLines.length) * 4.4 + 7;

          checkPageBreak(itemHeight + 4);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, cursorY, contentWidth, itemHeight, 1.5, 1.5, "FD");

          let innerY = cursorY + 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28); // Red-700
          doc.text(beforeLines, margin + 5, innerY);
          innerY += beforeLines.length * 4.4;

          doc.setFont("helvetica", "bold");
          doc.setTextColor(4, 120, 87); // Emerald-700
          doc.text(afterLines, margin + 5, innerY);
          innerY += afterLines.length * 4.4;

          doc.setFont("helvetica", "italic");
          doc.setTextColor(71, 85, 105);
          doc.text(whyLines, margin + 5, innerY);

          cursorY += itemHeight + 3.5;
        });
      }

      // 7. Quick Pre-Send Safety Checklist Box
      checkPageBreak(28);
      cursorY += 2;
      doc.setFillColor(236, 253, 245); // Emerald-50
      doc.setDrawColor(167, 243, 208); // Emerald-200
      doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(6, 95, 70);
      doc.text("PRE-SEND SAFETY CHECKLIST", margin + 5, cursorY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 78, 59);
      doc.text(
        `[${safetyChecklist.replacedBrackets ? "X" : " "}] Replaced bracketed placeholders such as [Your Name] and [Course ID]`,
        margin + 5,
        cursorY + 11.5
      );
      doc.text(
        `[${safetyChecklist.officialEmailSelected ? "X" : " "}] Verified official school, university, or personal sender account`,
        margin + 5,
        cursorY + 16.5
      );
      doc.text(
        `[${safetyChecklist.attachedDocuments ? "X" : " "}] Attached any required supporting documents (e.g., note, receipt, syllabus ref)`,
        margin + 5,
        cursorY + 21.5
      );

      // 8. Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Generated by Say It Right Communication Coach  |  Page ${p} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }

      const safeRelSlug = relationship
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      doc.save(`SayItRight_${safeRelSlug || "message"}.pdf`);

      setExportedPdfSuccess(true);
      playAnxietyBusterChime();
      setTimeout(() => setExportedPdfSuccess(false), 3000);
    } catch (_err) {
      // Fallback if PDF generation encounters any unexpected environment issue
      downloadTxtFile(
        "SayItRight_Polished_Message.txt",
        `${
          platform === "Email" && analysis.subject_line
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
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, persona }),
      });
      const data = await res.json();
      if (data?.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = readAloudSpeed;
        audioPlayerRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch (_e) {}

    // Browser TTS Fallback if no API key or offline
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate =
        persona === "seniors" ? Math.min(0.9, readAloudSpeed) : readAloudSpeed;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const baseVariantText =
    analysis?.versions?.[selectedVariant] || analysis?.polished_email || "";

  const formattedOutputText = formatOutputText(
    baseVariantText,
    outputTextFormat,
    {
      subjectLine: analysis?.subject_line || situation,
      recipient:
        professorName ||
        (persona === "college_student" ? "Professor [Last Name]" : relationship),
      sender: studentName || "[Your Name]",
      courseOrRef: courseOrRefCode,
    }
  );

  const rawDisplayedEmailBody =
    customEditedOutput !== null ? customEditedOutput : formattedOutputText;

  // Apply Subtle Emoji Placement Adapter when toggled on for informal/chat messages
  const displayedEmailBody =
    subtleEmojiEnhancer &&
    (persona === "friendly_chat" ||
      platform === "WhatsApp / Text Message" ||
      INFORMAL_RELATIONSHIPS.includes(relationship)) &&
    !/[🥺✨💛💖😊🤝☕]/.test(rawDisplayedEmailBody)
      ? `${rawDisplayedEmailBody.trim()} 🥺✨`
      : rawDisplayedEmailBody;

  const liveRawCheck = calculateLiveRawProfessionalism(roughDraft);
  const overthinkingRadar = analyzeOverthinkingRadar(roughDraft);
  const showCoolOffPrompt =
    writerMood === "Frustrated" ||
    writerMood === "Angry / Heated" ||
    overthinkingRadar.heatedYouAlwaysHits.length > 0;
  const liveDetectedLanguage = detectInputLanguage(roughDraft);
  const subjectLinesList =
    analysis?.subject_lines && analysis.subject_lines.length > 0
      ? analysis.subject_lines
      : analysis?.subject_line
      ? [analysis.subject_line]
      : [];

  const calmingBgClass =
    persona === "school_kids" || calmingTheme === "cartoon_sunny"
      ? "bg-amber-100/75 text-[#0F172A]"
      : calmingTheme === "mint_green"
      ? "bg-[#ECFDF5] text-[#0F172A]"
      : calmingTheme === "warm_purple"
      ? "bg-[#F5F3FF] text-[#0F172A]"
      : "bg-[#EFF6FF] text-[#0F172A]";

  const politenessVal =
    analysis?.readiness_scorecard?.politeness_score ?? 95;
  const clarityVal =
    analysis?.readiness_scorecard?.clarity_score ?? 91;

  const getScoreColorMeta = (score: number) => {
    if (score >= 80) {
      return {
        ringStroke: "#059669",
        barClass: "bg-emerald-600",
        badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
        statusText: "🟢 Safe & Polished",
      };
    }
    if (score >= 55) {
      return {
        ringStroke: "#D97706",
        barClass: "bg-amber-500",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
        statusText: "🟡 Review Suggested",
      };
    }
    return {
      ringStroke: "#DC2626",
      barClass: "bg-red-600",
      badgeClass: "bg-red-100 text-red-900 border-red-300",
      statusText: "🔴 Risky / Needs Polish",
    };
  };

  const politenessMeta = getScoreColorMeta(politenessVal);
  const clarityMeta = getScoreColorMeta(clarityVal);
  const rawScoreMeta = getScoreColorMeta(liveRawCheck.score);

  const earnedBadges = [
    {
      id: "no_passive_aggression",
      icon: "🛡️",
      label: "No Passive-Aggression",
      desc: "Zero blaming or defensive friction markers",
      active: politenessVal >= 80,
    },
    {
      id: "clear_subject",
      icon: "✨",
      label: "Clear Subject Line",
      desc: "Includes course/context tag & specific request",
      active: Boolean(analysis?.subject_line),
    },
    {
      id: "direct_respectful",
      icon: "🎯",
      label: "Direct & Respectful",
      desc: "Clear next step without rambling",
      active: clarityVal >= 80,
    },
    {
      id: "empathy_accountability",
      icon: "💎",
      label: "Solution-First Framing",
      desc: "Proposes a concrete, low-friction plan",
      active: true,
    },
    ...(apologyStripper
      ? [
          {
            id: "apology_free",
            icon: "🌟",
            label: "Gratitude Over Guilt",
            desc: "Swapped excessive 'sorry' for confident thank-you",
            active: true,
          },
        ]
      : []),
  ];

  const completedSafetyCount = [
    safetyChecklist.replacedBrackets,
    safetyChecklist.officialEmailSelected,
    safetyChecklist.attachedDocuments,
  ].filter(Boolean).length;

  return (
    <div
      className={`min-h-screen relative flex flex-col transition-colors duration-300 ${calmingBgClass} ${
        seniorLargeText ? "text-lg leading-relaxed" : "text-base"
      }`}
    >
      {/* Full-Screen Animated Cartoon Pictures Scrolling in the Backside for Kids Mode */}
      {persona === "school_kids" && <KidsCartoonBackdrop />}

      {/* 2. MICRO-INTERACTIONS & CELEBRATION ANIMATIONS OVERLAY (Balloons / Snow / Confetti) */}
      {celebrationEffect && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {Array.from({ length: 18 }).map((_, idx) => {
            const leftPct = (idx * 6) % 96;
            const delayMs = (idx % 6) * 180;
            const balloonItems = ["🎈", "🎈", "🎉", "⭐", "🎈", "✨"];
            const snowItems = ["❄️", "❅", "✨", "❄️", "🌟", "❅"];
            const confettiItems = ["🎉", "🎊", "✨", "🌟", "🏆", "💫"];
            const symbol =
              celebrationEffect === "balloons"
                ? balloonItems[idx % balloonItems.length]
                : celebrationEffect === "snow"
                ? snowItems[idx % snowItems.length]
                : confettiItems[idx % confettiItems.length];

            return (
              <div
                key={idx}
                style={{
                  left: `${leftPct}%`,
                  animationDelay: `${delayMs}ms`,
                }}
                className={`absolute text-3xl sm:text-4xl select-none ${
                  celebrationEffect === "balloons"
                    ? "animate-balloon-rise bottom-0"
                    : "animate-snow-fall top-0"
                }`}
              >
                {symbol}
              </div>
            );
          })}
        </div>
      )}
      {/* Top Bar Contract: Zone 1 (Single Brand Wordmark) — Zone 2 (Clean Text Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          Say It Right
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleSelectPersona("college_student")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              persona === "college_student"
                ? "border-teal-700 text-slate-900 font-semibold"
                : "border-transparent"
            }`}
          >
            College Students
          </button>
          <button
            type="button"
            onClick={() => handleSelectPersona("seniors")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              persona === "seniors"
                ? "border-teal-700 text-slate-900 font-semibold"
                : "border-transparent"
            }`}
          >
            Seniors &amp; Elders
          </button>
          <button
            type="button"
            onClick={() => handleSelectPersona("school_kids")}
            className={`transition-all whitespace-nowrap px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1 ${
              persona === "school_kids"
                ? "bg-amber-400 text-slate-950 font-extrabold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                : "bg-amber-100/80 text-amber-950 font-bold hover:bg-amber-200 border border-amber-300"
            }`}
          >
            <span>🎨 Kids Cartoon Zone</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPersona("women_advocacy")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              persona === "women_advocacy"
                ? "border-teal-700 text-slate-900 font-semibold"
                : "border-transparent"
            }`}
          >
            Women &amp; Self-Advocacy
          </button>
          <button
            type="button"
            onClick={() => handleSelectPersona("friendly_chat")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              persona === "friendly_chat"
                ? "border-teal-700 text-slate-900 font-semibold"
                : "border-transparent"
            }`}
          >
            Friendly Chat
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEasySimpleLayout((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              easySimpleLayout
                ? "bg-teal-700 border-teal-700 text-white"
                : "bg-teal-50 border-teal-300 text-teal-950 hover:bg-teal-100"
            }`}
            title="Switch between Simple Easy View (great for Kids & Seniors) and Full Detailed View"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>
              {easySimpleLayout ? "✓ Simple View On" : "Simple View (All Ages)"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSeniorLargeText((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              seniorLargeText
                ? "bg-teal-50 border-teal-700 text-teal-900"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span>{seniorLargeText ? "Standard Text" : "Large Text"}</span>
          </button>

          {analysis && (
            <button
              type="button"
              onClick={() =>
                downloadTxtFile(
                  "professor_email.txt",
                  `${
                    platform === "Email"
                      ? `Subject: ${analysis.subject_line}\n\n`
                      : ""
                  }${displayedEmailBody}`
                )
              }
              className="hidden sm:flex px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN INTERACTIVE COACHING WORKSPACE */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* LEFT SIDEBAR: Tone Selector, Quick-Fill Presets, Recipient/Situation, Inclusive Modes */}
        <aside
          className={`w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r p-5 space-y-5 transition-colors ${
            persona === "school_kids"
              ? "bg-white/85 backdrop-blur-xs border-slate-900/20"
              : "bg-white border-slate-200"
          }`}
        >
          {/* 1. AI Model / Tone Selector + Writer Expression / Mood Selector (Sidebar) */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-900">
                  1. AI Tone Selector
                </h2>
                <span className="text-[11px] text-teal-800 font-medium">
                  {toneStyle}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    "Ultra Formal",
                    "Polite & Direct",
                    "Apologetic",
                    "Persuasive",
                  ] as ToneOption[]
                ).map((tOption) => (
                  <button
                    key={tOption}
                    type="button"
                    onClick={() => {
                      setToneStyle(tOption);
                      handleGenerate({ toneOverride: tOption });
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors whitespace-nowrap truncate cursor-pointer ${
                      toneStyle === tOption
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {tOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Writer Expression / Mood Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="writer-mood-select"
                  className="text-xs font-semibold text-slate-900"
                >
                  Writer Expression / Mood
                </label>
                <span className="text-[11px] text-teal-800 font-medium">
                  {writerMood}
                </span>
              </div>
              <select
                id="writer-mood-select"
                value={writerMood}
                onChange={(e) => {
                  const nextMood = e.target.value as WriterMoodOption;
                  setWriterMood(nextMood);
                  handleGenerate({ moodOverride: nextMood });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                {WRITER_MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-tight">
                {
                  WRITER_MOOD_OPTIONS.find((m) => m.value === writerMood)
                    ?.hint
                }
              </p>
            </div>
          </div>

          {/* 5. Presets / Quick-Fill Examples in Sidebar */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-900">
                2. Quick-Fill Demo Presets
              </h2>
              <span className="text-[11px] text-slate-500">1-Click Load</span>
            </div>
            <div className="space-y-1.5">
              {currentPersona.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-teal-700 hover:bg-teal-50/40 text-left text-xs font-medium text-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{preset.buttonLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Professor Relationship, Situation & Personalization */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h2 className="text-xs font-semibold text-slate-900">
              3. Recipient &amp; Situation Setup
            </h2>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Select Recipient Relationship (Academic, Formal &amp; Personal)
              </label>
              <select
                value={relationship}
                onChange={(e) => {
                  const nextRel = e.target.value;
                  setRelationship(nextRel);
                  const isPersonal = INFORMAL_RELATIONSHIPS.includes(nextRel);
                  const nextPlat: PlatformOption = isPersonal
                    ? "WhatsApp / Text Message"
                    : platform;
                  if (isPersonal && platform === "Email") {
                    setPlatform("WhatsApp / Text Message");
                  }
                  handleGenerate({
                    relOverride: nextRel,
                    platformOverride: nextPlat,
                  });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <optgroup label={`${currentPersona.shortLabel} Recipients`}>
                  {currentPersona.relationships.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Informal & Personal Relationships">
                  {INFORMAL_RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Select Situation Type
              </label>
              <select
                value={situation}
                onChange={(e) => {
                  setSituation(e.target.value);
                  handleGenerate({ sitOverride: e.target.value });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <optgroup label={`${currentPersona.shortLabel} Situations`}>
                  {currentPersona.situations.map((sit) => (
                    <option key={sit} value={sit}>
                      {sit}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Personal & Informal Situations">
                  {INFORMAL_SITUATIONS.map((sit) => (
                    <option key={sit} value={sit}>
                      {sit}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                {currentPersona.defaultCourseLabel}
              </label>
              <input
                type="text"
                value={courseOrRefCode}
                onChange={(e) => setCourseOrRefCode(e.target.value)}
                placeholder={currentPersona.defaultCoursePlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  placeholder={currentPersona.recipientPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Your Name / ID
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={currentPersona.senderPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Audience Mode Switcher (College, Seniors, Kids, Women) */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h2 className="text-xs font-semibold text-slate-900">
              4. Inclusive Audience Modes
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectPersona("college_student")}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  persona === "college_student"
                    ? "bg-teal-50/80 border-teal-700 text-teal-950"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">College Student</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("seniors")}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  persona === "seniors"
                    ? "bg-teal-50/80 border-teal-700 text-teal-950"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">Seniors &amp; Elders</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("school_kids")}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  persona === "school_kids"
                    ? "bg-teal-50/80 border-teal-700 text-teal-950"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Smile className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">School Kids</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("women_advocacy")}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  persona === "women_advocacy"
                    ? "bg-teal-50/80 border-teal-700 text-teal-950"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">Self-Advocacy</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("friendly_chat")}
                className={`col-span-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  persona === "friendly_chat"
                    ? "bg-teal-50/80 border-teal-700 text-teal-950"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <MessageCircleHeart className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="truncate">
                      Friendly Chat (Friends, Partner &amp; General)
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                    New
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 5. Boosters & Language */}
          <div className="space-y-2.5 border-t border-slate-200 pt-4">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={apologyStripper}
                onChange={(e) => setApologyStripper(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-teal-700"
              />
              <span className="text-xs text-slate-700 leading-tight">
                <strong className="text-slate-900">Apology-Stripper:</strong>{" "}
                Swap unnecessary &ldquo;sorry&rdquo; for gratitude
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simplifyLanguage}
                onChange={(e) => setSimplifyLanguage(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-teal-700"
              />
              <span className="text-xs text-slate-700 leading-tight">
                <strong className="text-slate-900">Plain-Language Mode:</strong>{" "}
                Extra simple for kids &amp; seniors
              </span>
            </label>

            <div className="pt-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>Language / Output Style (Global &amp; Romanized)</span>
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  handleGenerate({ langOverride: e.target.value });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                {LANGUAGE_AND_SCRIPT_GROUPS.map((group) => (
                  <optgroup key={group.groupLabel} label={group.groupLabel}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                Supports native scripts &amp; Romanized mother-tongue typing (Hinglish, Tanglish, Tenglish).
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT STAGE */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header & Platform Toggle: [ Email | WhatsApp / Text Message | Slack / Discord ] */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{currentPersona.shortLabel} Mode</span>
                <span aria-hidden="true">·</span>
                <span>Mood: {writerMood}</span>
                <span aria-hidden="true">·</span>
                <span>Tone: {toneStyle}</span>
                <span aria-hidden="true">·</span>
                <span>Channel: {platform}</span>
                <span aria-hidden="true">·</span>
                <span>Language: {targetLanguage}</span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-slate-900">
                {currentPersona.fullTitle}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {currentPersona.subtitle}
              </p>
            </div>

            {/* WhatsApp / Discord / Slack Platform Toggle */}
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">
                Select Communication Channel:
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPlatform("Email");
                    handleGenerate({ platformOverride: "Email" });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    platform === "Email"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-teal-700" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlatform("WhatsApp / Text Message");
                    handleGenerate({
                      platformOverride: "WhatsApp / Text Message",
                    });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    platform === "WhatsApp / Text Message"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp / Text Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlatform("Slack / Discord");
                    handleGenerate({ platformOverride: "Slack / Discord" });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    platform === "Slack / Discord"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Slack / Discord</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. "ANXIETY-BUSTER" CALMING PALETTE, SOUND & CELEBRATION BAR */}
          <div className="bg-white/90 backdrop-blur-xs border border-teal-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <span>🌿 Anxiety-Buster Calming Backdrop:</span>
              </span>
              {[
                {
                  id: "soft_blue" as const,
                  label: "☁️ Soft Sky Blue",
                  swatch: "bg-sky-100 border-sky-300 text-sky-950",
                },
                {
                  id: "mint_green" as const,
                  label: "🌱 Mint Green",
                  swatch: "bg-emerald-100 border-emerald-300 text-emerald-950",
                },
                {
                  id: "warm_purple" as const,
                  label: "💜 Warm Lavender",
                  swatch: "bg-purple-100 border-purple-300 text-purple-950",
                },
                {
                  id: "cartoon_sunny" as const,
                  label: "☀️ Sunny Kids Gold",
                  swatch: "bg-amber-100 border-amber-400 text-amber-950",
                },
              ].map((themeOpt) => (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => setCalmingTheme(themeOpt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    calmingTheme === themeOpt.id
                      ? `${themeOpt.swatch} ring-2 ring-teal-700 font-bold`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {themeOpt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAnxietySoundEnabled((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  anxietySoundEnabled
                    ? "bg-teal-50 border-teal-300 text-teal-900"
                    : "bg-slate-100 border-slate-300 text-slate-600"
                }`}
                title="Toggle soothing chime when your draft is polished"
              >
                {anxietySoundEnabled ? "🔔 Calming Chime: ON" : "🔕 Chime: OFF"}
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPreferredCelebration("balloons");
                    triggerCelebration("balloons");
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    preferredCelebration === "balloons"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Launch celebratory balloons (st.balloons)"
                >
                  🎈 Balloons
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferredCelebration("snow");
                    triggerCelebration("snow");
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    preferredCelebration === "snow"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Launch calming snow (st.snow)"
                >
                  ❄️ Calm Snow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferredCelebration("confetti");
                    triggerCelebration("confetti");
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    preferredCelebration === "confetti"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Launch confetti burst"
                >
                  🎉 Confetti
                </button>
              </div>
            </div>
          </div>

          {/* ALL-AGES QUICK START BANNER: Step 1 (Who Are You?) -> Step 2 (Write/Speak) -> Step 3 (Copy Ready Message) */}
          <div className="bg-white border-2 border-teal-600/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  🌟 Easy for Every Age (Kids, Students, Adults &amp; Seniors)
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                  Step 1: Who Are You Writing As Today? (Tap One Box Below)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRoboWordTrigger("__OPEN_APP_GUIDE__")}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>🤖 Ask Bibo: How to Use This App</span>
              </button>
            </div>

            {/* Big, Visual All-Ages Mode Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPersona("college_student")}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  persona === "college_student"
                    ? "bg-teal-50 border-teal-700 text-teal-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-lg mb-1">🎓</div>
                <p className="font-bold text-xs text-slate-900">
                  College Student
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Email professors, TAs &amp; advisors
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("school_kids")}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                  persona === "school_kids"
                    ? "bg-amber-300 border-slate-900 text-slate-950 shadow-[4px_4px_0px_0px_#0f172a] -translate-y-0.5"
                    : "bg-amber-50/90 border-amber-400 text-slate-900 hover:bg-amber-100 hover:border-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🎨🎒</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-pink-500 text-white border border-slate-900">
                    Cartoon Fun!
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-950">
                  Kids Cartoon Zone!
                </p>
                <p className="text-[11px] text-slate-800 mt-0.5 leading-snug font-medium">
                  Captain Pencil ✏️, games &amp; stars for kids!
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("seniors")}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  persona === "seniors"
                    ? "bg-teal-50 border-teal-700 text-teal-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-lg mb-1">👵</div>
                <p className="font-bold text-xs text-slate-900">
                  Seniors &amp; Elders
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Doctors, medical bills &amp; family help
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("women_advocacy")}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  persona === "women_advocacy"
                    ? "bg-teal-50 border-teal-700 text-teal-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-lg mb-1">💪</div>
                <p className="font-bold text-xs text-slate-900">
                  Self-Advocacy
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Say &lsquo;no&rsquo; &amp; set warm boundaries
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona("friendly_chat")}
                className={`col-span-2 sm:col-span-1 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  persona === "friendly_chat"
                    ? "bg-teal-50 border-teal-700 text-teal-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-lg mb-1">💬</div>
                <p className="font-bold text-xs text-slate-900">
                  Friendly Chat
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Bestie, partner, family &amp; general
                </p>
              </button>
            </div>

            {/* One-Tap Difficult Words Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800">
                📖 Confused by a hard word? Tap any word to see its simple meaning:
              </span>
              {Object.keys(SIMPLE_WORD_GLOSSARY).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setRoboWordTrigger(word)}
                  className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-700 hover:text-white text-teal-950 border border-teal-300 font-medium transition-colors cursor-pointer capitalize"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* CARTOONIC KIDS ADVENTURE WORLD (Active when persona === "school_kids") */}
          {persona === "school_kids" && (
            <section className="rounded-3xl bg-gradient-to-br from-amber-200/90 via-sky-200/90 to-pink-200/90 backdrop-blur-xs border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] p-5 sm:p-6 space-y-5">
              {/* Interactive Scrolling Cartoon Pictures Parade Reel */}
              <KidsCartoonParadeStrip
                onTapCartoonCard={(cheer) => {
                  setKidStarsCount((c) => c + 1);
                  setKidMascotBubble(cheer);
                }}
              />

              {/* Top Cartoon Header with Custom SVG Mascots + Star Counter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/95 rounded-2xl border-3 border-slate-900 p-4 shadow-[4px_4px_0px_0px_#0f172a]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Cute Cartoon Mascot Trio SVG (Captain Pencil + Professor Hoot + Sunny Star) */}
                  <div className="flex items-center -space-x-2 shrink-0 self-start sm:self-center">
                    {/* Captain Pencil SVG */}
                    <div
                      className="w-16 h-16 rounded-2xl bg-amber-300 border-3 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_#0f172a] -rotate-3"
                      title="Captain Pencil!"
                    >
                      <svg viewBox="0 0 64 64" className="w-13 h-13">
                        {/* Superhero Cape */}
                        <path
                          d="M14 34 L6 54 L26 48 Z"
                          fill="#EF4444"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        {/* Pencil Body */}
                        <rect
                          x="22"
                          y="18"
                          width="20"
                          height="30"
                          rx="3"
                          fill="#FACC15"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        {/* Pink Eraser Hat */}
                        <rect
                          x="22"
                          y="10"
                          width="20"
                          height="9"
                          rx="4"
                          fill="#F472B6"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        {/* Pencil Tip */}
                        <polygon
                          points="22,48 42,48 32,60"
                          fill="#FDE68A"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <polygon points="29,55 35,55 32,60" fill="#0F172A" />
                        {/* Cute Cartoon Eyes & Big Smile */}
                        <circle cx="28" cy="30" r="3" fill="#0F172A" />
                        <circle cx="36" cy="30" r="3" fill="#0F172A" />
                        <circle cx="27" cy="29" r="1" fill="#FFFFFF" />
                        <circle cx="35" cy="29" r="1" fill="#FFFFFF" />
                        <path
                          d="M27 37 Q32 42 37 37"
                          fill="none"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Professor Hoot the Cartoon Owl SVG */}
                    <div
                      className="w-16 h-16 rounded-2xl bg-sky-300 border-3 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_#0f172a] rotate-3"
                      title="Professor Hoot the Wise Owl!"
                    >
                      <svg viewBox="0 0 64 64" className="w-13 h-13">
                        {/* Owl Body */}
                        <ellipse
                          cx="32"
                          cy="36"
                          rx="18"
                          ry="19"
                          fill="#8B5CF6"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        {/* Owl Belly */}
                        <ellipse
                          cx="32"
                          cy="41"
                          rx="11"
                          ry="11"
                          fill="#DDD6FE"
                          stroke="#0F172A"
                          strokeWidth="2"
                        />
                        {/* Big Cartoon Glasses & Eyes */}
                        <circle
                          cx="25"
                          cy="29"
                          r="6.5"
                          fill="#FFFFFF"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="39"
                          cy="29"
                          r="6.5"
                          fill="#FFFFFF"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        <circle cx="25" cy="29" r="3" fill="#0F172A" />
                        <circle cx="39" cy="29" r="3" fill="#0F172A" />
                        <circle cx="24" cy="28" r="1" fill="#FFFFFF" />
                        <circle cx="38" cy="28" r="1" fill="#FFFFFF" />
                        {/* Orange Beak */}
                        <polygon
                          points="29,33 35,33 32,39"
                          fill="#F97316"
                          stroke="#0F172A"
                          strokeWidth="2"
                        />
                        {/* Cute Graduation Cap */}
                        <polygon
                          points="16,16 32,10 48,16 32,22"
                          fill="#0F172A"
                        />
                        <line
                          x1="44"
                          y1="17"
                          x2="47"
                          y2="25"
                          stroke="#FACC15"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Cartoon Mascot Speech Bubble */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-xs font-extrabold border-2 border-slate-900">
                        🎨 CARTOON KIDS CLUBHOUSE
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        Captain Pencil ✏️ &amp; Professor Hoot 🦉 say:
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-slate-950 bg-amber-100/90 px-3.5 py-2 rounded-xl border-2 border-slate-900">
                      &ldquo;{kidMascotBubble}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Gamified Kid Kindness Star Counter */}
                <div className="flex items-center gap-3 self-start lg:self-center bg-amber-300 px-4 py-2.5 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                      Super Kid Stars
                    </p>
                    <p className="text-lg font-extrabold text-slate-950 leading-none">
                      {kidStarsCount} Gold Stars! 🏆
                    </p>
                  </div>
                </div>
              </div>

              {/* Cartoon Step 1A: How Are You Feeling? (6 Bouncy Cartoon Feeling Stickers) */}
              <div className="bg-white/95 rounded-2xl border-3 border-slate-900 p-4 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-2">
                    <span>🎭 1. How Do You Feel Inside? (Tap a Cartoon Sticker!)</span>
                  </h3>
                  <span className="text-xs font-bold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full border border-pink-300">
                    +1 Gold Star ⭐ when you tap!
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    {
                      id: "uh_oh",
                      emoji: "😰",
                      title: "Uh-Oh! Nervous",
                      sub: "Scared to get in trouble",
                      mood: "Anxious / Stressed" as WriterMoodOption,
                      bg: "bg-sky-100 hover:bg-sky-200",
                      activeBg: "bg-sky-300",
                      cheer:
                        "Don't worry! Everyone gets nervous sometimes. We'll help your teacher see how hard you tried! 💙⭐",
                    },
                    {
                      id: "oops_sorry",
                      emoji: "🥺",
                      title: "Oops! Sorry",
                      sub: "I made a mistake",
                      mood: "Apologetic" as WriterMoodOption,
                      bg: "bg-amber-100 hover:bg-amber-200",
                      activeBg: "bg-amber-300",
                      cheer:
                        "Mistakes help our brains grow! Saying an honest, brave 'I'm sorry' is a superpower! 🌟",
                    },
                    {
                      id: "not_fair",
                      emoji: "😤",
                      title: "Grrr! Not Fair!",
                      sub: "Feeling frustrated",
                      mood: "Frustrated" as WriterMoodOption,
                      bg: "bg-rose-100 hover:bg-rose-200",
                      activeBg: "bg-rose-300",
                      cheer:
                        "Take a deep dragon breath! 🐉 We'll turn your frustration into calm, smart words that work!",
                    },
                    {
                      id: "confused_owl",
                      emoji: "🤔",
                      title: "Huh? Confused",
                      sub: "Need extra help",
                      mood: "Calm / Neutral" as WriterMoodOption,
                      bg: "bg-purple-100 hover:bg-purple-200",
                      activeBg: "bg-purple-300",
                      cheer:
                        "Professor Hoot says: Asking questions when you're stuck makes you the smartest kid in class! 🦉✨",
                    },
                    {
                      id: "super_brave",
                      emoji: "🦁",
                      title: "Brave Lion!",
                      sub: "Ready to speak up",
                      mood: "Confident" as WriterMoodOption,
                      bg: "bg-emerald-100 hover:bg-emerald-200",
                      activeBg: "bg-emerald-300",
                      cheer:
                        "ROAR! 🦁 You're speaking up with kindness and courage! Let's write an awesome message!",
                    },
                    {
                      id: "yay_happy",
                      emoji: "🤩",
                      title: "Yay! Excited!",
                      sub: "Sharing happy news",
                      mood: "Excited" as WriterMoodOption,
                      bg: "bg-pink-100 hover:bg-pink-200",
                      activeBg: "bg-pink-300",
                      cheer:
                        "Woohoo! 🎉 High-five from Captain Pencil! Let's share your awesome news!",
                    },
                  ].map((sticker) => {
                    const isSelected = kidSelectedSticker === sticker.id;
                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => {
                          setKidSelectedSticker(sticker.id);
                          setWriterMood(sticker.mood);
                          setKidStarsCount((c) => c + 1);
                          setKidMascotBubble(sticker.cheer);
                          handleGenerate({ moodOverride: sticker.mood });
                        }}
                        className={`p-3 rounded-2xl border-3 border-slate-900 text-left transition-all cursor-pointer ${
                          isSelected
                            ? `${sticker.activeBg} shadow-[4px_4px_0px_0px_#0f172a] -translate-y-1`
                            : `${sticker.bg} shadow-[2px_2px_0px_0px_#0f172a] hover:-translate-y-0.5`
                        }`}
                      >
                        <div className="text-2xl mb-1">{sticker.emoji}</div>
                        <p className="font-extrabold text-xs text-slate-950">
                          {sticker.title}
                        </p>
                        <p className="text-[11px] font-medium text-slate-800 leading-tight mt-0.5">
                          {sticker.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cartoon Step 1B: Pick a School Story Adventure! (Big Comic Cards) */}
              <div className="bg-white/95 rounded-2xl border-3 border-slate-900 p-4 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-slate-950">
                    🎮 2. Pick a Fun School Adventure Card (1-Tap Try It!):
                  </h3>
                  <span className="text-xs font-bold text-slate-700">
                    Click any card to load a kid story!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {currentPersona.presets.map((preset, idx) => {
                    const cardColors = [
                      "bg-amber-200 hover:bg-amber-300",
                      "bg-sky-200 hover:bg-sky-300",
                      "bg-emerald-200 hover:bg-emerald-300",
                      "bg-pink-200 hover:bg-pink-300",
                      "bg-purple-200 hover:bg-purple-300",
                    ];
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setKidStarsCount((c) => c + 1);
                          setKidMascotBubble(
                            `Awesome pick! Loaded "${preset.buttonLabel}" — look how polite your message looks below! ⭐`
                          );
                          handleLoadPreset(preset);
                        }}
                        className={`p-3 rounded-2xl border-3 border-slate-900 ${
                          cardColors[idx % cardColors.length]
                        } shadow-[3px_3px_0px_0px_#0f172a] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer`}
                      >
                        <span className="font-extrabold text-xs text-slate-950 leading-snug">
                          {preset.buttonLabel}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-900 self-start">
                          Tap to Play →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cartoon Step 1C: Magic Polite Word Power-Ups */}
              <div className="bg-white/95 rounded-2xl border-3 border-slate-900 p-4 shadow-[4px_4px_0px_0px_#0f172a] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-slate-950">
                    🪄 3. Sprinkle &ldquo;Magic Polite Words&rdquo; Into Your Box!
                  </h3>
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400">
                    Tap any magic wand button to add it to your draft!
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      label: "✨ 'Could you please help me understand...'",
                      phrase:
                        "Could you please help me understand how to do this part?",
                      cheer:
                        "Magic Sparkle! ✨ Teachers LOVE when you ask 'Could you please help me understand'!",
                    },
                    {
                      label: "🌟 'Thank you for being so patient with me!'",
                      phrase: "Thank you so much for being patient with me!",
                      cheer:
                        "Super Star Power! 🌟 Saying 'Thank you for being patient' makes everyone smile!",
                    },
                    {
                      label: "🦸 'I tried my very best on this!'",
                      phrase:
                        "I tried my very best on this assignment, even though I got stuck.",
                      cheer:
                        "Hero Shield! 🦸 Showing that you tried your best first is super responsible!",
                    },
                    {
                      label: "🤝 'Can we work together to fix this?'",
                      phrase: "Can we please work together so we both do great?",
                      cheer:
                        "Teamwork Power-Up! 🤝 Great friends and classmates solve problems together!",
                    },
                    {
                      label: "💡 'Could you show me one example?'",
                      phrase:
                        "Could you please show me one example tomorrow before class?",
                      cheer:
                        "Lightbulb Moment! 💡 Asking for one example makes learning super easy!",
                    },
                  ].map((pw, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        handleAddKidMagicPhrase(pw.phrase, pw.cheer)
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-xs font-extrabold text-slate-950 transition-all cursor-pointer"
                    >
                      {pw.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 3. SCENARIO CARDS & ONE-CLICK "CRISIS STARTERS" (Kids & Teens + College Students) */}
          <section className="bg-white/95 backdrop-blur-xs rounded-xl border-2 border-teal-600/60 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  ⚡ Freeze-Buster Scenario Cards
                </span>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  One-Click &ldquo;Crisis Starters&rdquo; (Don&apos;t Know How to Start? Tap One!)
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Loads scenario + polishes immediately
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* For Kids & Teens */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <span>🎒 For Kids &amp; Teens (School Situations)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    Kid-Friendly
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      icon: "🎒",
                      title: "Asking for help on a hard assignment",
                      relationship: "School Teacher (Kind & Helpful)",
                      situation: "Didn't Understand Homework / Need Extra Help",
                      courseOrRef: "7th Grade Math - Worksheet #4",
                      draft:
                        "i tried doing worksheet 4 tonight with my mom and we both got stuck on the fraction word problems. i don't want to get in trouble tomorrow for not finishing it.",
                    },
                    {
                      icon: "🤝",
                      title: "Resolving a group project issue politely",
                      relationship: "Group Project Classmate / Friend",
                      situation: "Speaking Up About an Unfair Group Project",
                      courseOrRef: "Science Fair Volcano Poster",
                      draft:
                        "hey you haven't done any of the slides yet and it's due friday. i don't want to do the whole thing by myself again.",
                    },
                    {
                      icon: "⚽",
                      title: "Informing a coach about a missed practice",
                      relationship: "Sports Coach or Club Advisor",
                      situation: "Forgot Homework or Made a Mistake in Class",
                      courseOrRef: "After-School Soccer Practice",
                      draft:
                        "coach i have a dentist appointment after school tomorrow and i can't come to soccer practice. please don't bench me for saturday's game, i will practice drills at home!",
                    },
                  ].map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPersona("school_kids");
                        setRelationship(starter.relationship);
                        setSituation(starter.situation);
                        setCourseOrRefCode(starter.courseOrRef);
                        setRoughDraft(starter.draft);
                        setSimplifyLanguage(true);
                        triggerCelebration("balloons");
                        handleGenerate({
                          draftOverride: starter.draft,
                          personaOverride: "school_kids",
                          relOverride: starter.relationship,
                          sitOverride: starter.situation,
                          simplifyOverride: true,
                          refOverride: starter.courseOrRef,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg bg-white hover:bg-amber-100/80 border border-amber-300 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-900">
                        {starter.icon} &ldquo;{starter.title}&rdquo;
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* For College Students */}
              <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                    <span>🎓 For College Students (Academic Crises)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-sky-900 bg-sky-200/70 px-2 py-0.5 rounded-full">
                    Faculty-Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      icon: "🩺",
                      title: "Emergency absence request (with clinic note)",
                      relationship: "Strict / Formal Professor",
                      situation: "Sick & Missed Exam",
                      courseOrRef: "COMP 101 - Course ID #1042",
                      draft:
                        "hey prof, i woke up with a 102 fever and severe stomach flu this morning and completely missed the 9 AM midterm exam. i have an official clinic note—can i please take a make-up exam this week?",
                    },
                    {
                      icon: "📑",
                      title: "Requesting a grade clarification on a paper",
                      relationship: "Friendly / Approachable Professor",
                      situation: "Grade Review / Clarification",
                      courseOrRef: "ECON 204 - Sec 02",
                      draft:
                        "Hi professor, I worked really hard on Essay 2 and got a 68%. I would love to understand the rubric feedback on my analysis section during your office hours this week.",
                    },
                    {
                      icon: "💼",
                      title:
                        "Asking for a recommendation letter / research spot",
                      relationship: "Department Head / Dean",
                      situation: "Request Recommendation Letter",
                      courseOrRef: "BIO 110 - Honors Seminar",
                      draft:
                        "Hey Professor, I'm applying for a summer undergraduate research fellowship due in three weeks and since I earned an A in your seminar last term, could you write a recommendation letter for me?",
                    },
                  ].map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPersona("college_student");
                        setRelationship(starter.relationship);
                        setSituation(starter.situation);
                        setCourseOrRefCode(starter.courseOrRef);
                        setRoughDraft(starter.draft);
                        triggerCelebration("confetti");
                        handleGenerate({
                          draftOverride: starter.draft,
                          personaOverride: "college_student",
                          relOverride: starter.relationship,
                          sitOverride: starter.situation,
                          refOverride: starter.courseOrRef,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg bg-white hover:bg-sky-100/80 border border-sky-300 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-900">
                        {starter.icon} &ldquo;{starter.title}&rdquo;
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Interactive "Do's & Don'ts" Accordion */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setEtiquetteTipsOpen((prev) => !prev)}
              className="w-full px-5 py-3.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Pin className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  📌 General Email Etiquette Tips (Do&apos;s &amp; Don&apos;ts for Emailing Faculty)
                </span>
              </div>
              {etiquetteTipsOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {etiquetteTipsOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <p className="font-semibold text-emerald-950 text-sm">
                    ✅ Faculty Email DO&apos;s
                  </p>
                  <ul className="space-y-1.5 text-emerald-900 list-disc pl-4">
                    <li>
                      <strong>Always use your university `.edu` email address</strong> so faculty spam filters don&apos;t block your message.
                    </li>
                    <li>
                      <strong>Include your exact Course Code &amp; Section Number</strong> (e.g., <code className="font-mono">[COMP 101, Sec 02]</code>) in the subject line.
                    </li>
                    <li>
                      <strong>Check the course syllabus first</strong> before asking about grading scales or office hours.
                    </li>
                    <li>
                      <strong>Propose a specific, low-friction plan</strong> (e.g., &ldquo;Could I submit by Friday at 5:00 PM?&rdquo;).
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-50/60 border border-red-200 space-y-2">
                  <p className="font-semibold text-red-950 text-sm">
                    ❌ Faculty Email DON&apos;Ts
                  </p>
                  <ul className="space-y-1.5 text-red-900 list-disc pl-4">
                    <li>
                      <strong>Don&apos;t open with &ldquo;Hey prof&rdquo; or &ldquo;Yo&rdquo;</strong>—always start with &ldquo;Dear Professor [Last Name],&rdquo;.
                    </li>
                    <li>
                      <strong>Don&apos;t write a long emotional rant</strong>—keep your explanation brief, dignified, and accountable.
                    </li>
                    <li>
                      <strong>Don&apos;t demand grade changes over email</strong>—ask to review your exam rubric together during office hours.
                    </li>
                    <li>
                      <strong>Don&apos;t over-apologize for existing</strong>—swap &ldquo;Sorry to bother you&rdquo; for &ldquo;Thank you for your guidance.&rdquo;
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* 1 & 3. "VIBE CHECK" & INTENT SELECTOR + "HINGLISH / TANGLISH" CHAT SLANG & EMOJI ADAPTER */}
          <section className="bg-white/95 backdrop-blur-xs rounded-2xl border-2 border-pink-400/80 p-5 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-700">
                  💖 &ldquo;Vibe Check&rdquo; &amp; Intent Selector (For Lovers, Dating, Besties &amp; Friends)
                </span>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Pick the Exact Vibe &amp; Emotional Outcome You Want to Achieve
                </h2>
              </div>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-300 text-xs font-bold text-pink-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={subtleEmojiEnhancer}
                  onChange={(e) => setSubtleEmojiEnhancer(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-pink-400 text-pink-600"
                />
                <span>🥺 Subtle Warm Emoji Placement: {subtleEmojiEnhancer ? "ON" : "OFF"}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* For Lovers / Dating */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-950">
                    💑 For Lovers &amp; Dating
                  </span>
                  <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    Romantic &amp; Warm
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VIBE_CHECK_OPTIONS.filter((v) => v.category === "lovers").map(
                    (vibe) => (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => handleSelectVibeCheck(vibe)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVibeId === vibe.id
                            ? "bg-rose-600 border-rose-700 text-white shadow-2xs"
                            : "bg-white border-rose-200 text-slate-900 hover:bg-rose-100/60"
                        }`}
                      >
                        <div className="text-xs font-extrabold flex items-center gap-1.5">
                          <span>{vibe.icon}</span>
                          <span>{vibe.label}</span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* For Besties & Friends */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-950">
                    🫶 For Besties &amp; Close Friends
                  </span>
                  <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    Zero Stiff Formality
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VIBE_CHECK_OPTIONS.filter(
                    (v) => v.category === "friends"
                  ).map((vibe) => (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => handleSelectVibeCheck(vibe)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedVibeId === vibe.id
                          ? "bg-purple-700 border-purple-800 text-white shadow-2xs"
                          : "bg-white border-purple-200 text-slate-900 hover:bg-purple-100/60"
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center gap-1.5">
                        <span>{vibe.icon}</span>
                        <span>{vibe.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. "Hinglish / Tanglish" Chat Slang & Emoji Adapter Bar */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-950">
                  🗣️ &ldquo;Hinglish / Tanglish / Spanglish&rdquo; Chat Slang &amp; Emoji Adapter (No Textbook English!):
                </span>
                <span className="text-[11px] text-amber-900">
                  Transforms cold sentences like <em>&ldquo;I am busy today&rdquo;</em> into warm, authentic texts
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SLANG_SCRIPT_PRESETS.map((slang) => (
                  <button
                    key={slang.id}
                    type="button"
                    onClick={() => {
                      setPersona("friendly_chat");
                      setPlatform("WhatsApp / Text Message");
                      setTargetLanguage(slang.languageOption);
                      setRoughDraft(slang.coldBefore);
                      setCustomEditedOutput(slang.warmAfter);
                      playAnxietyBusterChime();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-slate-900 transition-colors cursor-pointer"
                  >
                    {slang.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 5. "COOL-OFF" DELAY PROMPT FOR HEATED MOMENTS */}
          {showCoolOffPrompt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-sky-50 border-2 border-amber-400 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-extrabold text-slate-950 flex items-center gap-2">
                  <span className="text-lg">🕊️</span>
                  <span>
                    &ldquo;Take a breath! Would you like to reframe this text using &lsquo;I feel&rsquo; statements instead of &lsquo;You always&rsquo; statements before sending?&rdquo;
                  </span>
                </p>
                <p className="text-xs text-slate-700">
                  Heated texts sent in frustration can trigger defensiveness. Reframing around how <strong>you feel</strong> helps the other person actually listen.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={startCoolOffBreathing}
                  className="px-3 py-2 rounded-xl bg-white border border-sky-300 hover:bg-sky-50 text-sky-950 text-xs font-bold cursor-pointer"
                >
                  {coolOffBreathingSec > 0
                    ? `🌬️ Breathe In... (${coolOffBreathingSec}s)`
                    : "🌬️ 5-Sec Cool-Off Breath"}
                </button>
                <button
                  type="button"
                  onClick={handleReframeWithIFeel}
                  className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer"
                >
                  ✨ Reframe with &ldquo;I Feel&rdquo; Statements
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Enter Your Rough Draft: Text or Voice Note ("Rant-to-Email") + Pre-Refinement Red Flag Checker */}
          <section
            className={`rounded-2xl p-5 space-y-4 transition-all ${
              persona === "school_kids"
                ? "bg-white border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]"
                : "bg-white rounded-xl border-2 border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    persona === "school_kids"
                      ? "text-pink-600 bg-pink-100 px-2.5 py-0.5 rounded-full border border-slate-900"
                      : "text-teal-800"
                  }`}
                >
                  {persona === "school_kids"
                    ? "🎨 Step 2: Tell Captain Pencil What Happened!"
                    : "✍️ Step 2: Say What Happened in Your Own Words"}
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                  {persona === "school_kids"
                    ? "Write Your Story in the Magic Box or Talk Into the Microphone! 🎤"
                    : "Type Your Rough Thoughts or Record a Voice Note"}
                </h2>
                <p className="text-xs text-slate-600">
                  {persona === "school_kids"
                    ? "Don't worry about spelling or big words—Captain Pencil and Bibo Robo will help make it super polite!"
                    : "Don't worry about grammar or politeness—type in any language or speak out loud!"}
                </p>
              </div>

              {/* Tabbed Radio Toggle: ["✍️ Type Text", "🎤 Record Voice Note"] + Save / Load Draft */}
              <div className="flex flex-wrap items-center gap-2 self-start">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveDraftToStorage}
                    title="Save current rough draft and persona settings to browser storage"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-teal-700" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadLastDraftFromStorage}
                    disabled={!hasSavedDraft}
                    title={
                      hasSavedDraft
                        ? "Load your last saved draft and persona settings"
                        : "Save a draft first to enable loading"
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
                    <span>Load last draft</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setInputMode("text")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      inputMode === "text"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ✍️ Type Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("voice")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      inputMode === "voice"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🎤 Record Voice Note
                  </button>
                </div>
              </div>
            </div>

            {draftStorageFeedback && (
              <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900 flex items-center justify-between">
                <span>✓ {draftStorageFeedback}</span>
              </div>
            )}

            {inputMode === "text" ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="rough-draft-textarea"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Your Raw Thoughts:
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-600">
                      🌐 Auto-Detected Input Language:{" "}
                      <strong className="text-teal-800">
                        {liveDetectedLanguage.detectedLabel}
                      </strong>
                    </span>
                    {targetLanguage !==
                      liveDetectedLanguage.matchedLanguageOption &&
                      targetLanguage !== "Auto-Detect (Match Input Language)" && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetLanguage(
                              liveDetectedLanguage.matchedLanguageOption
                            );
                            handleGenerate({
                              langOverride:
                                liveDetectedLanguage.matchedLanguageOption,
                            });
                          }}
                          className="text-teal-700 font-semibold hover:underline cursor-pointer"
                        >
                          Switch output to{" "}
                          {liveDetectedLanguage.matchedLanguageOption} →
                        </button>
                      )}
                  </div>
                </div>
                <textarea
                  id="rough-draft-textarea"
                  rows={4}
                  value={roughDraft}
                  onChange={(e) => setRoughDraft(e.target.value)}
                  placeholder={currentPersona.placeholderHint}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/50 p-3.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 focus:outline-none transition-colors"
                />
              </div>
            ) : (
              /* Voice Note Input ("Rant-to-Email") Widget */
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      🎤 Record your explanation out loud (&ldquo;Rant-to-Email&rdquo;)
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Speak freely or upload a voice note—Gemini multimodal audio will transcribe and rewrite it into a polished message.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isRecordingAudio ? (
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopAudioRecording}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap animate-pulse cursor-pointer"
                      >
                        <MicOff className="w-4 h-4 text-red-400" />
                        <span>Stop &amp; Capture Audio</span>
                      </button>
                    )}

                    <label className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>Upload Audio Clip</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={loadSampleRantAudioTranscript}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium whitespace-nowrap cursor-pointer"
                    >
                      Load Sample Car-Breakdown Rant
                    </button>
                  </div>
                </div>

                {recordedAudioUrl && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-emerald-900">
                        ✅ Audio captured! Ready to refine with Gemini multimodal audio.
                      </p>
                      <audio
                        controls
                        src={recordedAudioUrl}
                        className="h-8 max-w-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordedAudioUrl(null);
                        setRecordedAudioBase64("");
                      }}
                      className="text-xs text-red-700 hover:underline flex items-center gap-1 self-start sm:self-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Audio</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Live Transcription / Accompanying Raw Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={roughDraft}
                    onChange={(e) => setRoughDraft(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* 4. "Red Flag Checker" Score Meter (Pre-Refinement Professionalism Score 0-100%) */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    🔍 Pre-Refinement &ldquo;Red Flag Checker&rdquo; Meter
                  </span>
                  <span className="text-xs text-slate-500">
                    ({liveRawCheck.statusLabel})
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                  Raw Professionalism Score:{" "}
                  <span
                    className={
                      liveRawCheck.score < 55
                        ? "text-red-700"
                        : "text-amber-700"
                    }
                  >
                    {liveRawCheck.score}%
                  </span>{" "}
                  · Casual/Stress Markers: {liveRawCheck.casualHits}
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    liveRawCheck.score < 50
                      ? "bg-red-600"
                      : liveRawCheck.score < 75
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${liveRawCheck.score}%` }}
                />
              </div>
            </div>

            {/* 2. "OVERTHINKING SHIELD" (Overthinking Radar Text Analyzer) */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-purple-950">
                    🛡️ &ldquo;Overthinking Shield&rdquo; (Live Texting Trap Radar)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-900">
                  Word Count: {overthinkingRadar.wordCount} words · Pressure Meter:{" "}
                  {overthinkingRadar.pressureScore}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Trap 1: Clinginess / Over-explaining Warning */}
                <div
                  className={`p-3 rounded-lg border ${
                    overthinkingRadar.isClingyOrLong
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-white border-emerald-200 text-emerald-950"
                  }`}
                >
                  <p className="font-bold mb-1">
                    {overthinkingRadar.isClingyOrLong
                      ? "⚠️ Clinginess / Over-Explaining"
                      : "🟢 Clinginess / Length Check"}
                  </p>
                  <p className="text-[11px] leading-snug">
                    {overthinkingRadar.clingyMessage}
                  </p>
                </div>

                {/* Trap 2: Passive-Aggression Alert */}
                <div
                  className={`p-3 rounded-lg border ${
                    overthinkingRadar.passiveAggressiveHits.length > 0
                      ? "bg-red-50 border-red-300 text-red-950"
                      : "bg-white border-emerald-200 text-emerald-950"
                  }`}
                >
                  <p className="font-bold mb-1">
                    {overthinkingRadar.passiveAggressiveHits.length > 0
                      ? "⚠️ Passive-Aggression Alert"
                      : "🟢 Passive-Aggression Radar"}
                  </p>
                  <p className="text-[11px] leading-snug">
                    {overthinkingRadar.passiveAggressiveHits.length > 0
                      ? `Flagged: "${overthinkingRadar.passiveAggressiveHits.join(
                          '", "'
                        )}". Phrases like "Fine, whatever", "K.", or "I guess" sound cold—our polish replaces them with warm honesty.`
                      : 'Clear! Zero cold phrases like "Fine, whatever", "K.", or "I guess" detected.'}
                  </p>
                </div>

                {/* Trap 3: Pressure Meter */}
                <div
                  className={`p-3 rounded-lg border ${
                    overthinkingRadar.pressureHits.length > 0
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-white border-emerald-200 text-emerald-950"
                  }`}
                >
                  <p className="font-bold mb-1">
                    {overthinkingRadar.pressureHits.length > 0
                      ? "⚠️ High Reply Pressure Detected"
                      : "🟢 Breathing Room / Pressure Meter"}
                  </p>
                  <p className="text-[11px] leading-snug">
                    {overthinkingRadar.pressureHits.length > 0
                      ? `Detected urgent markers (${overthinkingRadar.pressureHits.join(
                          ", "
                        )}). Leaving room to breathe gets warmer replies.`
                      : "Leaves warm breathing room without demanding an instant reply."}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Generate Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500">
                Calibrating for{" "}
                <strong className="text-slate-800">{toneStyle}</strong> tone on{" "}
                <strong className="text-slate-800">{platform}</strong>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  if (persona === "school_kids") {
                    setKidStarsCount((c) => c + 2);
                    setKidMascotBubble(
                      "KAPOW! 🚀 You earned +2 Gold Stars for making a Super-Polite Hero Message! Check it out below! ⭐"
                    );
                  }
                  triggerCelebration(preferredCelebration);
                  handleGenerate();
                }}
                className={`px-6 py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60 ${
                  persona === "school_kids"
                    ? "rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]"
                    : "rounded-lg bg-teal-700 hover:bg-teal-800 text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {persona === "school_kids"
                        ? "✨ Making Magic Words..."
                        : "Refining & Scoring Draft..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {persona === "school_kids"
                        ? "🚀 Blast Off! Make My Super-Polite Message! (+2 ⭐)"
                        : "Generate Polished Draft & Learn"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}
          </section>

          {/* OUTPUT SECTION */}
          {analysis && (
            <div className="space-y-6">
              {/* 1. GAMIFIED "ETIQUETTE SCORE METER" (Visual Progress Rings + Color-Coded Bars) & INSTANT FEEDBACK BADGES */}
              <section
                className={`bg-white/95 backdrop-blur-xs rounded-2xl p-5 space-y-5 ${
                  persona === "school_kids"
                    ? "border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]"
                    : "border-2 border-teal-600/70 shadow-2xs"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                      🏅 Gamified Etiquette Scoreboard &amp; Instant Feedback Badges
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      Your Message Score Meter (Green = Safe · Yellow = Review · Red = Risky)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerCelebration(preferredCelebration)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🎈 Celebrate My Improvement!</span>
                  </button>
                </div>

                {/* Visual Progress Rings + Color-Coded Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Politeness Score Ring & Bar */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={politenessMeta.ringStroke}
                          strokeWidth="6"
                          strokeDasharray={163.36}
                          strokeDashoffset={
                            163.36 - (163.36 * politenessVal) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-mono text-xs font-extrabold text-slate-900">
                        {politenessVal}/100
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">
                          Politeness Score
                        </p>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          ▲ {analysis.readiness_scorecard?.politeness_delta || "+48%"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${politenessMeta.barClass} transition-all duration-500`}
                          style={{ width: `${politenessVal}%` }}
                        />
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${politenessMeta.badgeClass}`}
                      >
                        {politenessMeta.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Clarity Score Ring & Bar */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={clarityMeta.ringStroke}
                          strokeWidth="6"
                          strokeDasharray={163.36}
                          strokeDashoffset={
                            163.36 - (163.36 * clarityVal) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-mono text-xs font-extrabold text-slate-900">
                        {clarityVal}/100
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">
                          Clarity Score
                        </p>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          ▲ {analysis.readiness_scorecard?.clarity_delta || "+32%"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${clarityMeta.barClass} transition-all duration-500`}
                          style={{ width: `${clarityVal}%` }}
                        />
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${clarityMeta.badgeClass}`}
                      >
                        {clarityMeta.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Raw Draft Before vs After Meter */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={rawScoreMeta.ringStroke}
                          strokeWidth="6"
                          strokeDasharray={163.36}
                          strokeDashoffset={
                            163.36 - (163.36 * liveRawCheck.score) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-mono text-xs font-extrabold text-slate-900">
                        {liveRawCheck.score}/100
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">
                          Original Draft Score
                        </p>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Before Polish
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${rawScoreMeta.barClass} transition-all duration-500`}
                          style={{ width: `${liveRawCheck.score}%` }}
                        />
                      </div>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-900 border-emerald-300">
                        Upgraded to {politenessVal}/100! 🚀
                      </span>
                    </div>
                  </div>
                </div>

                {/* Achievement Badges Row */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      🏆 Earned Achievement Badges on This Draft:
                    </span>
                    <span className="text-[11px] text-teal-800 font-semibold">
                      {earnedBadges.length} Badges Unlocked!
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.id}
                        title={b.desc}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-teal-300 text-teal-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="text-sm">{b.icon}</span>
                        <span>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3. Dedicated "Subject Line Generator" Box (3 Catchy, Professional Subject Lines) */}
              {platform === "Email" && subjectLinesList.length > 0 && (
                <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-700" />
                        <span>
                          Subject Line Generator (3 Catchy, Professional Options)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Professors get dozens of emails daily—click any option to copy a high-response subject line.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {subjectLinesList.slice(0, 3).map((subj, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <span className="text-[11px] font-mono text-teal-800 font-semibold">
                            Option 0{idx + 1}
                          </span>
                          <p className="text-xs font-mono font-medium text-slate-900 mt-1 break-words">
                            {subj}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copySubject(subj, idx)}
                          className="self-start text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSubjectIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied Option {idx + 1}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Subject</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 3 MAIN TABS (STEP 3: YOUR READY-TO-SEND MESSAGE) */}
              <section
                className={`bg-white overflow-hidden ${
                  persona === "school_kids"
                    ? "rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]"
                    : "rounded-xl border-2 border-teal-700/80 shadow-xs"
                }`}
              >
                <div
                  className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 ${
                    persona === "school_kids"
                      ? "bg-gradient-to-r from-sky-400 via-amber-300 to-pink-300 text-slate-950 border-b-4 border-slate-900"
                      : "bg-teal-900 text-white"
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        persona === "school_kids"
                          ? "text-slate-950 bg-white/90 px-2.5 py-0.5 rounded-full border-2 border-slate-900"
                          : "text-teal-200"
                      }`}
                    >
                      {persona === "school_kids"
                        ? "🏆 Step 3: Your Super-Hero Message is Ready!"
                        : "✅ Step 3: Your Ready-to-Send Result"}
                    </span>
                    <h3
                      className={`font-display text-base font-extrabold mt-1 ${
                        persona === "school_kids"
                          ? "text-slate-950"
                          : "text-white"
                      }`}
                    >
                      {persona === "school_kids"
                        ? "🌟 Ready to Copy, Read Out Loud, or Change Format!"
                        : `Polished ${
                            platform === "Email" ? "Email" : "Message"
                          } & Friendly Coaching`}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadFormattedPdf}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        exportedPdfSuccess
                          ? "bg-emerald-500 border-emerald-400 text-white"
                          : persona === "school_kids"
                          ? "bg-white border-2 border-slate-900 text-slate-950 hover:bg-amber-100 shadow-[2px_2px_0px_0px_#0f172a]"
                          : "bg-white/15 border-white/30 text-white hover:bg-white/25"
                      }`}
                    >
                      {exportedPdfSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>PDF Saved!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>📄 Export PDF</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleReadAloud(
                          `${
                            platform === "Email"
                              ? `Subject: ${analysis.subject_line}. `
                              : ""
                          }${displayedEmailBody}`
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isSpeaking
                          ? "bg-amber-400 border-amber-300 text-slate-950"
                          : "bg-teal-800 border-teal-600 text-white hover:bg-teal-700"
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop Reading</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>🔊 Read Message Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-b border-slate-200 bg-slate-50 px-4 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveOutputTab("tab1")}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        activeOutputTab === "tab1"
                          ? "border-teal-700 text-teal-900 bg-white rounded-t-lg"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>
                        ✨ 1. Polished {platform === "Email" ? "Email" : "Message"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab("tab2")}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        activeOutputTab === "tab2"
                          ? "border-teal-700 text-teal-900 bg-white rounded-t-lg"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-teal-700" />
                      <span>💡 2. Why This Works (Easy Lessons)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab("tab3")}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        activeOutputTab === "tab3"
                          ? "border-teal-700 text-teal-900 bg-white rounded-t-lg"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>⚠️ 3. Tone Check &amp; Checklist</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: POLISHED EMAIL + DOWNLOAD (.TXT) + PROFESSOR SIMULATOR + BEFORE/AFTER COMPARISON */}
                {activeOutputTab === "tab1" && (
                  <div className="p-6 space-y-6">
                    {/* Variant Selector + Action Bar (Copy Email & Download .txt & Predict Professor's Reaction) */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                        <button
                          type="button"
                          onClick={() => setSelectedVariant("warm_respectful")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            selectedVariant === "warm_respectful"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {toneStyle} (Primary)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVariant("concise_direct")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            selectedVariant === "concise_direct"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Short &amp; Punchy
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVariant("simple_clear")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            selectedVariant === "simple_clear"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Plain-Language (Kids / Seniors)
                        </button>
                      </div>

                      {/* One-Click Copy, Download .txt, and Predict Professor's Reaction Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isEditingOutput) {
                              setCustomEditedOutput(displayedEmailBody);
                              setIsEditingOutput(true);
                            } else {
                              setIsEditingOutput(false);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                            isEditingOutput
                              ? "bg-teal-700 border-teal-700 text-white"
                              : "bg-white border-slate-300 hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <span>
                            {isEditingOutput
                              ? "✓ Done Editing Text"
                              : "✏️ Edit Output Text"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyBodyText(displayedEmailBody)}
                          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedBody ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>
                                Copy {platform === "Email" ? "Email" : "Message"}
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={downloadFormattedPdf}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                            exportedPdfSuccess
                              ? "bg-emerald-600 border-emerald-700 text-white"
                              : "bg-teal-700 hover:bg-teal-800 border-teal-700 text-white shadow-2xs"
                          }`}
                        >
                          {exportedPdfSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>PDF Exported!</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>📄 Export PDF</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadTxtFile(
                              "professor_email.txt",
                              `${
                                platform === "Email" &&
                                outputTextFormat !== "formal_letter" &&
                                outputTextFormat !== "template_placeholders"
                                  ? `Subject: ${analysis.subject_line}\n\n`
                                  : ""
                              }${displayedEmailBody}`
                            )
                          }
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-700" />
                          <span>📥 Download (.txt)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePredictReaction}
                          className="px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-700 hover:bg-teal-100/70 text-teal-950 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                          <span>🧪 Predict Reaction</span>
                        </button>
                      </div>
                    </div>

                    {/* OUTPUT TEXT FORMAT SELECTOR BAR */}
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-teal-950">
                          📐 Change Output Text Format (Click any format below):
                        </span>
                        <span className="text-[11px] text-teal-800 font-medium">
                          {
                            OUTPUT_TEXT_FORMAT_OPTIONS.find(
                              (f) => f.id === outputTextFormat
                            )?.shortDesc
                          }
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {OUTPUT_TEXT_FORMAT_OPTIONS.map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => {
                              setOutputTextFormat(fmt.id);
                              setCustomEditedOutput(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              outputTextFormat === fmt.id
                                ? "bg-teal-700 border-teal-700 text-white shadow-2xs"
                                : "bg-white border-teal-200 text-slate-800 hover:bg-teal-100/60"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. "READ ALOUD" AUDIO PLAYER BAR (Accessibility Booster) */}
                    <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-sky-700 shrink-0" />
                          <span>
                            🔊 &ldquo;Read Aloud&rdquo; Voice Preview Player (Accessibility Booster)
                          </span>
                        </p>
                        <p className="text-[11px] text-sky-900">
                          Hear how your polite sentence sounds out loud before hitting send—great for kids, seniors &amp; non-native speakers!
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-sky-200 text-[11px] font-semibold text-slate-700">
                          <span>Speed:</span>
                          {[
                            { rate: 0.85, label: "0.85x Slow" },
                            { rate: 0.98, label: "1x Normal" },
                            { rate: 1.15, label: "1.15x Fast" },
                          ].map((sp) => (
                            <button
                              key={sp.rate}
                              type="button"
                              onClick={() => setReadAloudSpeed(sp.rate)}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                readAloudSpeed === sp.rate
                                  ? "bg-sky-700 text-white"
                                  : "hover:bg-sky-50 text-slate-700"
                              }`}
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleReadAloud(
                              `${
                                platform === "Email"
                                  ? `Subject: ${analysis.subject_line}. `
                                  : ""
                              }${displayedEmailBody}`
                            )
                          }
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isSpeaking
                              ? "bg-amber-400 border-amber-500 text-slate-950"
                              : "bg-sky-700 hover:bg-sky-800 border-sky-700 text-white"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Stop Voice Preview</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>▶️ Play Voice Preview</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Polished Output Text Box (View or Live Edit) */}
                    {isEditingOutput ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-teal-900">
                            ✏️ Live Editor — customize any word or name before copying:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEditedOutput(null);
                              setIsEditingOutput(false);
                            }}
                            className="text-xs text-slate-500 hover:text-red-700 underline cursor-pointer"
                          >
                            Reset to AI Output
                          </button>
                        </div>
                        <textarea
                          rows={9}
                          value={displayedEmailBody}
                          onChange={(e) =>
                            setCustomEditedOutput(e.target.value)
                          }
                          className="w-full p-4 rounded-lg bg-white border-2 border-teal-600 text-slate-900 leading-relaxed focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-900">
                        {displayedEmailBody}
                      </div>
                    )}

                    {/* 6. QUICK "SAFETY CHECKLIST" BEFORE SENDING (Interactive Toggle Checklist Below Final Draft) */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <span>✅ Quick &ldquo;Safety Checklist&rdquo; Before Sending</span>
                          </h4>
                          <p className="text-[11px] text-emerald-900">
                            Check off these 3 quick items before you hit send in your email or chat app:
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-emerald-300 text-xs font-mono font-bold text-emerald-950">
                          {completedSafetyCount}/3 Checked{" "}
                          {completedSafetyCount === 3 ? "🎉 Ready!" : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {[
                          {
                            key: "replacedBrackets" as const,
                            label:
                              "Did you replace bracketed details like [Your Name] and [Course ID]?",
                          },
                          {
                            key: "officialEmailSelected" as const,
                            label:
                              "Is your official school/university email selected as the sender?",
                          },
                          {
                            key: "attachedDocuments" as const,
                            label:
                              "Did you attach any required documents (e.g., doctor's note, receipt, or rubric)?",
                          },
                        ].map((chk) => {
                          const checked = safetyChecklist[chk.key];
                          return (
                            <button
                              key={chk.key}
                              type="button"
                              onClick={() => {
                                setSafetyChecklist((prev) => {
                                  const next = {
                                    ...prev,
                                    [chk.key]: !prev[chk.key],
                                  };
                                  if (
                                    next.replacedBrackets &&
                                    next.officialEmailSelected &&
                                    next.attachedDocuments
                                  ) {
                                    triggerCelebration("balloons");
                                  } else if (!prev[chk.key]) {
                                    playAnxietyBusterChime();
                                  }
                                  return next;
                                });
                              }}
                              className={`p-3 rounded-xl border text-left text-xs font-medium flex items-start gap-2.5 transition-all cursor-pointer ${
                                checked
                                  ? "bg-emerald-600 border-emerald-700 text-white shadow-2xs"
                                  : "bg-white border-emerald-300 text-slate-800 hover:bg-emerald-100/60"
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-white shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                              )}
                              <span className={checked ? "line-through" : ""}>
                                {chk.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. INTERACTIVE "PARTNER / RECIPIENT REACTION SIMULATOR" (Always Accessible + 3 Predicted Outcomes) */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            💞 Interactive &ldquo;Partner &amp; Recipient Reaction Simulator&rdquo; (3 Predicted Outcomes)
                          </h4>
                          <p className="text-xs text-slate-600">
                            How a <strong>{relationship}</strong> is likely to interpret your message based on length, warmth, and tone:
                          </p>
                        </div>
                        {isSimulatingReaction && (
                          <span className="text-xs text-teal-800 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Simulating...
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-1.5">
                          <p className="text-xs font-extrabold text-emerald-950">
                            🟢 Outcome A (Reassured)
                          </p>
                          <p className="text-[11px] font-semibold text-emerald-800">
                            &ldquo;Felt heard and appreciated.&rdquo;
                          </p>
                          <p className="text-xs text-emerald-950 leading-relaxed italic pt-1 border-t border-emerald-200/70">
                            &ldquo;
                            {simulatedReactions?.likely_reply ||
                              analysis.professor_reactions?.likely_reply}
                            &rdquo;
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 space-y-1.5">
                          <p className="text-xs font-extrabold text-amber-950">
                            🟡 Outcome B (Confused)
                          </p>
                          <p className="text-[11px] font-semibold text-amber-800">
                            &ldquo;Might think you are upset if sentences are too short.&rdquo;
                          </p>
                          <p className="text-xs text-amber-950 leading-relaxed italic pt-1 border-t border-amber-200/70">
                            &ldquo;
                            {simulatedReactions?.followup_question ||
                              analysis.professor_reactions?.followup_question}
                            &rdquo;
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-red-50/90 border border-red-300 space-y-1.5">
                          <p className="text-xs font-extrabold text-red-950">
                            🔴 Outcome C (Defensive)
                          </p>
                          <p className="text-[11px] font-semibold text-red-800">
                            &ldquo;Feels accused; consider opening with a warm statement first.&rdquo;
                          </p>
                          <p className="text-xs text-red-950 leading-relaxed italic pt-1 border-t border-red-200/70">
                            &ldquo;
                            {simulatedReactions?.worst_case_boundary ||
                              analysis.professor_reactions
                                ?.worst_case_boundary}
                            &rdquo;
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Interactive "Before & After" Comparison Slider & 2-Column Diff */}
                    <div className="border-t border-slate-200 pt-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            🔄 Interactive &ldquo;Before &amp; After&rdquo; Transformation
                          </h4>
                          <p className="text-xs text-slate-500">
                            Compare your raw thoughts side-by-side with the polished message and inspect specific phrase upgrades.
                          </p>
                        </div>

                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                          <button
                            type="button"
                            onClick={() =>
                              setComparisonViewMode("side_by_side")
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                              comparisonViewMode === "side_by_side"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600"
                            }`}
                          >
                            2-Column Side-by-Side
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setComparisonViewMode("slider_split")
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                              comparisonViewMode === "slider_split"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600"
                            }`}
                          >
                            Interactive Balance Slider
                          </button>
                        </div>
                      </div>

                      {comparisonViewMode === "slider_split" && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-red-700">
                              Original Draft ({100 - sliderPosition}% weight)
                            </span>
                            <span className="font-mono text-slate-600 tabular-nums">
                              Drag Comparison Slider: {sliderPosition}%
                            </span>
                            <span className="text-emerald-700">
                              Polished Version ({sliderPosition}% weight)
                            </span>
                          </div>
                          <input
                            type="range"
                            min={15}
                            max={85}
                            value={sliderPosition}
                            onChange={(e) =>
                              setSliderPosition(Number(e.target.value))
                            }
                            className="w-full accent-teal-700 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          className="p-4 rounded-lg bg-red-50/50 border border-red-200 space-y-2 transition-opacity"
                          style={{
                            opacity:
                              comparisonViewMode === "slider_split"
                                ? Math.max(0.35, (100 - sliderPosition) / 60)
                                : 1,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-red-800">
                              Original Rough Draft (Before)
                            </span>
                            <span className="text-[11px] font-mono text-red-700">
                              Score: {liveRawCheck.score}%
                            </span>
                          </div>
                          <p className="text-xs text-red-950 whitespace-pre-wrap leading-relaxed">
                            {analysis.transcribed_text || roughDraft}
                          </p>
                        </div>

                        <div
                          className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2 transition-opacity"
                          style={{
                            opacity:
                              comparisonViewMode === "slider_split"
                                ? Math.max(0.35, sliderPosition / 60)
                                : 1,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-800">
                              Polished Version (After)
                            </span>
                            <span className="text-[11px] font-mono text-emerald-700">
                              Politeness:{" "}
                              {analysis.readiness_scorecard?.politeness_score ??
                                96}
                              %
                            </span>
                          </div>
                          <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed">
                            {displayedEmailBody}
                          </p>
                        </div>
                      </div>

                      {/* 4. INTERACTIVE "BEFORE & AFTER" HIGHLIGHTING WITH HOVER/TAP EXPLANATION TOOLTIPS */}
                      {analysis.before_after_highlights?.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-extrabold text-slate-900">
                              🔍 Interactive &ldquo;Before &amp; After&rdquo; Phrase Badges (Hover or Tap Green Badge for Pop-Up Explanation!):
                            </p>
                            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              💡 Hover or tap any 🟢 After phrase
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {analysis.before_after_highlights.map((item, i) => {
                              const isTooltipOpen =
                                activeHighlightTooltip === i;
                              return (
                                <div
                                  key={i}
                                  onMouseEnter={() =>
                                    setActiveHighlightTooltip(i)
                                  }
                                  onClick={() =>
                                    setActiveHighlightTooltip(
                                      isTooltipOpen ? null : i
                                    )
                                  }
                                  className="relative p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 transition-all text-xs space-y-2 shadow-2xs cursor-pointer"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
                                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-950">
                                      <span className="font-extrabold text-red-800 block mb-0.5">
                                        🔴 Before:
                                      </span>
                                      <span className="line-through opacity-90">
                                        &ldquo;{item.original_red}&rdquo;
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 text-emerald-950 relative group">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-extrabold text-emerald-800">
                                          🟢 After (Hover/Tap for Why):
                                        </span>
                                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded">
                                          Why? 💡
                                        </span>
                                      </div>
                                      <span className="font-semibold">
                                        &ldquo;{item.polished_green}&rdquo;
                                      </span>
                                    </div>
                                  </div>

                                  {/* Hover / Tap Pop-Up Explanation Tooltip */}
                                  {isTooltipOpen && (
                                    <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs flex items-start gap-2 shadow-md">
                                      <span className="text-amber-300 shrink-0">
                                        💡 Why this change works:
                                      </span>
                                      <span className="text-slate-100">
                                        {item.reason}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: WHY THIS WORKS (ETIQUETTE LESSONS) */}
                {activeOutputTab === "tab2" && (
                  <div className="p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Why This Works: Etiquette &amp; Psychology Breakdown
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Learn why specific changes were made so you build lasting confidence for future tough conversations.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {analysis.etiquette_lessons?.map((lesson, index) => (
                        <div
                          key={index}
                          className="p-5 rounded-lg border border-slate-200 bg-white space-y-4"
                        >
                          <h4 className="font-display text-base font-semibold text-slate-900">
                            0{index + 1}. {lesson.principle}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-200">
                              <p className="text-[11px] font-semibold text-red-800 mb-1">
                                Original / Risky Phrasing:
                              </p>
                              <p className="text-xs text-red-950 italic">
                                &ldquo;{lesson.before_snippet}&rdquo;
                              </p>
                            </div>

                            <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                              <p className="text-[11px] font-semibold text-emerald-800 mb-1">
                                Polished Framing:
                              </p>
                              <p className="text-xs text-emerald-950 font-medium">
                                &ldquo;{lesson.after_snippet}&rdquo;
                              </p>
                            </div>
                          </div>

                          <div className="text-sm text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">
                              Why it works:{" "}
                            </strong>
                            {lesson.why_it_works}
                          </div>

                          {lesson.simple_kid_friendly_tip && (
                            <div className="pt-2 border-t border-slate-100 text-xs text-teal-900">
                              <strong>
                                Plain-Language Takeaway (For Kids, Seniors &amp; Quick Learning):{" "}
                              </strong>
                              {lesson.simple_kid_friendly_tip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: TONE ANALYSIS & FLAGS */}
                {activeOutputTab === "tab3" && (
                  <div className="p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Tone Analysis &amp; Red Flags
                      </h3>
                      <p className="text-sm text-slate-700 mt-1">
                        {analysis.tone_analysis?.overall_tone_summary}
                      </p>
                    </div>

                    {analysis.tone_analysis?.apology_audit && (
                      <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-teal-950">
                            Self-Advocacy &amp; Apology Audit
                          </p>
                          <p className="text-xs text-teal-900">
                            {analysis.tone_analysis.apology_audit.coaching_note}
                          </p>
                        </div>
                        <div className="shrink-0 font-mono text-xs text-teal-950 bg-white px-3 py-1.5 rounded border border-teal-200 tabular-nums">
                          Over-apologies removed:{" "}
                          <strong>
                            {
                              analysis.tone_analysis.apology_audit
                                .unnecessary_apologies_found
                            }
                          </strong>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Detected Friction Points in Your Rough Draft
                      </h4>
                      {analysis.tone_analysis?.flags?.map((flag, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg border border-slate-200 bg-white space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">
                              {flag.type}
                            </span>
                            <span className="text-xs font-mono text-amber-800">
                              ▲ {flag.severity.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong className="text-slate-800">
                              Flagged in rough draft:{" "}
                            </strong>
                            &ldquo;{flag.flagged_phrase}&rdquo;
                          </p>
                          <p className="text-xs text-slate-600">
                            <strong className="text-slate-800">
                              Why it could backfire:{" "}
                            </strong>
                            {flag.issue_explanation}
                          </p>
                          <p className="text-xs text-teal-900 font-medium">
                            <strong>Suggested Fix: </strong>
                            {flag.suggested_fix}
                          </p>
                        </div>
                      ))}
                    </div>

                    {analysis.tone_analysis?.missing_details_checklist?.length >
                      0 && (
                      <div className="border-t border-slate-200 pt-5">
                        <h4 className="text-xs font-semibold text-slate-800 mb-2.5">
                          Missing Details Checklist (Verify Before Sending):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {analysis.tone_analysis.missing_details_checklist.map(
                            (item, idx) => {
                              const isChecked = !!checkedItems[idx];
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    setCheckedItems((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                  className={`p-3 rounded-lg border text-left text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                                    isChecked
                                      ? "bg-emerald-50/60 border-emerald-600 text-emerald-950 line-through opacity-80"
                                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <span>{item}</span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Cute Robo Figure AI Chatbot at Bottom-Right Corner for Clearing Doubts & Word Meanings */}
      <CuteRoboChatbot
        persona={persona}
        currentDraft={roughDraft}
        polishedEmail={displayedEmailBody}
        externalWordTrigger={roboWordTrigger}
        onClearExternalTrigger={() => setRoboWordTrigger(null)}
      />
    </div>
  );
}
