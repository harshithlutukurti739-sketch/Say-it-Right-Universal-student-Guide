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
} from "lucide-react";
import {
  buildFallbackResponse,
  SIMPLE_WORD_GLOSSARY,
} from "./fallbackData";
import CuteRoboChatbot from "./CuteRoboChatbot";

export type PersonaId =
  | "college_student"
  | "seniors"
  | "school_kids"
  | "women_advocacy";

export type ToneOption =
  | "Ultra Formal"
  | "Polite & Direct"
  | "Apologetic"
  | "Persuasive";

export type PlatformOption =
  | "Email"
  | "WhatsApp / Text Message"
  | "Slack / Discord";

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
    shortLabel: "School Kids & Teens",
    fullTitle: "School Students & Kids Friendly Coach",
    subtitle:
      "Build confidence talking to school teachers, coaches, and classmates when homework is confusing, mistakes happen, or group work feels unfair.",
    relationships: [
      "School Teacher (Kind & Helpful)",
      "Strict School Teacher / Principal",
      "Group Project Classmate / Friend",
      "Sports Coach or Club Advisor",
    ],
    situations: [
      "Didn't Understand Homework / Need Extra Help",
      "Forgot Homework or Made a Mistake in Class",
      "Speaking Up About an Unfair Group Project",
      "Apologizing to a Friend or Teacher",
    ],
    placeholderHint:
      "Write how you feel or record a quick voice note! We'll help you sound polite and brave.",
    defaultCourseLabel: "Class Name & Grade",
    defaultCoursePlaceholder: "e.g., 7th Grade Math, Period 3",
    senderPlaceholder: "e.g., Leo (Room 204)",
    recipientPlaceholder: "e.g., Mrs. Davis",
    presets: [
      {
        id: "kid_homework",
        buttonLabel: "📘 Stuck on Math Homework",
        relationship: "School Teacher (Kind & Helpful)",
        situation: "Didn't Understand Homework / Need Extra Help",
        courseOrRef: "7th Grade Pre-Algebra, Period 2",
        draft:
          "i tried doing worksheet 4 tonight with my mom and we both got stuck on the fraction word problems. i don't want to get in trouble tomorrow for not finishing it.",
      },
      {
        id: "kid_group",
        buttonLabel: "🤝 Unfair Group Project Partner",
        relationship: "Group Project Classmate / Friend",
        situation: "Speaking Up About an Unfair Group Project",
        courseOrRef: "Science Fair Volcano Poster",
        draft:
          "hey you haven't done any of the slides yet and it's due friday. i don't want to do the whole thing by myself again.",
      },
      {
        id: "kid_forgot",
        buttonLabel: "🎒 Forgot Assignment at Home",
        relationship: "Strict School Teacher / Principal",
        situation: "Forgot Homework or Made a Mistake in Class",
        courseOrRef: "8th Grade History, Period 4",
        draft:
          "I did my whole history poster last night on the kitchen table and accidentally left it at home when I ran for the bus. Can my mom drop it off or can I bring it tomorrow?",
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
  const [targetLanguage, setTargetLanguage] = useState<string>("English");

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

  // Output Tabs & Variants
  const [activeOutputTab, setActiveOutputTab] = useState<
    "tab1" | "tab2" | "tab3"
  >("tab1");
  const [selectedVariant, setSelectedVariant] = useState<
    "warm_respectful" | "concise_direct" | "simple_clear"
  >("warm_respectful");
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

    const activePersona = overrides?.personaOverride || persona;
    const activePersonaCfg = PERSONA_CONFIGS[activePersona];
    const activeTone = overrides?.toneOverride || toneStyle;
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
    const activeLang =
      overrides?.langOverride !== undefined
        ? overrides.langOverride
        : targetLanguage;
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
      utterance.rate = persona === "seniors" ? 0.9 : 0.98;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const displayedEmailBody =
    analysis?.versions?.[selectedVariant] || analysis?.polished_email || "";

  const liveRawCheck = calculateLiveRawProfessionalism(roughDraft);
  const subjectLinesList =
    analysis?.subject_lines && analysis.subject_lines.length > 0
      ? analysis.subject_lines
      : analysis?.subject_line
      ? [analysis.subject_line]
      : [];

  return (
    <div
      className={`min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col ${
        seniorLargeText ? "text-lg leading-relaxed" : "text-base"
      }`}
    >
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
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              persona === "school_kids"
                ? "border-teal-700 text-slate-900 font-semibold"
                : "border-transparent"
            }`}
          >
            School Kids
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
        </nav>

        <div className="flex items-center gap-2.5">
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
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Email (.txt)</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN INTERACTIVE COACHING WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* LEFT SIDEBAR: Tone Selector, Quick-Fill Presets, Recipient/Situation, Inclusive Modes */}
        <aside className="w-full lg:w-[360px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-5">
          {/* 1. AI Model / Tone Selector (Sidebar) */}
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
                Select Professor / Recipient Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => {
                  setRelationship(e.target.value);
                  handleGenerate({ relOverride: e.target.value });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                {currentPersona.relationships.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
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
                {currentPersona.situations.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
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
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>Output Language</span>
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  handleGenerate({ langOverride: e.target.value });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
              >
                <option value="English">English</option>
                <option value="Spanish (Español)">Spanish (Español)</option>
                <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                <option value="Mandarin Chinese (中文)">
                  Mandarin Chinese (中文)
                </option>
                <option value="French (Français)">French (Français)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT STAGE */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header & Platform Toggle: [ Email | WhatsApp / Text Message | Slack / Discord ] */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{currentPersona.shortLabel} Mode</span>
                <span aria-hidden="true">·</span>
                <span>Tone: {toneStyle}</span>
                <span aria-hidden="true">·</span>
                <span>Channel: {platform}</span>
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

          {/* Easy 3-Step Visual Guide + One-Tap Difficult Words Helper Bar */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-teal-100 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Pick Who You Are &amp; Situation
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Use the left menu or tap a 1-Click Demo Preset button.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-teal-100 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Type or Speak Your Raw Thoughts
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Don&apos;t worry about grammar or politeness—just say what happened!
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-teal-100 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Copy Polished Message &amp; Ask Bibo 🤖
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Copy your ready-to-send email or ask Bibo Robo in the bottom-right corner!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-teal-200/70 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-teal-950">
                🤖 Confused by a hard word? Tap any word to ask Bibo Robo its simple meaning:
              </span>
              {Object.keys(SIMPLE_WORD_GLOSSARY).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setRoboWordTrigger(word)}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-teal-700 hover:text-white text-teal-900 border border-teal-300 font-medium transition-colors cursor-pointer capitalize"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

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

          {/* 1. Enter Your Rough Draft: Text or Voice Note ("Rant-to-Email") + Pre-Refinement Red Flag Checker */}
          <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  1. Enter Your Rough Draft
                </h2>
                <p className="text-xs text-slate-500">
                  Choose Input Type: Type your raw thoughts or record an unfiltered voice note (&ldquo;Rant-to-Email&rdquo;).
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
                <label
                  htmlFor="rough-draft-textarea"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Your Raw Thoughts:
                </label>
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
                onClick={() => handleGenerate()}
                className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Refining &amp; Scoring Draft...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Generate Polished Draft &amp; Learn</span>
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
              {/* 5. Instant "Email Readiness" Score Card at Top of Output */}
              <section className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-700">
                    Instant Email Readiness Score Card (Before vs. After Polish)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Channel: {analysis.platform_used || platform} · Tone:{" "}
                    {analysis.tone_used || toneStyle}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                    <p className="text-xs text-slate-500">
                      Raw Draft Professionalism
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                        {analysis.readiness_scorecard
                          ?.raw_professionalism_score ?? liveRawCheck.score}
                        %
                      </span>
                      <span className="text-xs font-medium text-amber-800">
                        Before Refinement
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {analysis.readiness_scorecard
                        ?.raw_professionalism_label ||
                        "Casual / Stressed Draft"}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                    <p className="text-xs text-slate-500">Clarity Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                        {analysis.readiness_scorecard?.clarity_score ?? 90}%
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        ▲ {analysis.readiness_scorecard?.clarity_delta || "+30%"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Structured ask &amp; context
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                    <p className="text-xs text-slate-500">Politeness Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                        {analysis.readiness_scorecard?.politeness_score ?? 95}%
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        ▲{" "}
                        {analysis.readiness_scorecard?.politeness_delta ||
                          "+50%"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Respectful faculty framing
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <p className="text-xs text-emerald-900 font-medium">
                      Tone Warning Status
                    </p>
                    <p className="text-lg font-semibold text-emerald-950 mt-1">
                      {analysis.readiness_scorecard?.tone_warning_status ||
                        "Safe to Send 🟢"}
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Zero passive-aggressive flags
                    </p>
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

              {/* 3 MAIN TABS */}
              <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
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
                        ✨ Polished {platform === "Email" ? "Email" : "Message"}
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
                      <span>💡 Why This Works (Etiquette Lessons)</span>
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
                      <span>⚠️ Tone Analysis &amp; Flags</span>
                    </button>
                  </div>

                  <div className="pb-2">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isSpeaking
                          ? "bg-amber-50 border-amber-600 text-amber-900"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                          <span>Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                          <span>Listen Aloud (Gemini TTS)</span>
                        </>
                      )}
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
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-700" />
                          <span>📥 Download Email (.txt)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePredictReaction}
                          className="px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-700 hover:bg-teal-100/70 text-teal-950 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                          <span>🧪 Predict Professor&apos;s Reaction</span>
                        </button>
                      </div>
                    </div>

                    {/* Polished Output Text Box */}
                    <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-900">
                      {displayedEmailBody}
                    </div>

                    {/* 4. "Professor Response Simulator" Output */}
                    {showReactionSimulator && (
                      <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              🧪 Professor Response Simulator (3 Predicted Outcomes)
                            </h4>
                            <p className="text-xs text-slate-500">
                              Based on a <strong>{relationship}</strong> receiving this{" "}
                              <strong>{toneStyle}</strong> message about{" "}
                              <strong>{situation}</strong>:
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
                          <div className="p-4 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                            <p className="text-xs font-semibold text-emerald-950">
                              🟢 Likely Reply
                            </p>
                            <p className="text-xs text-emerald-900 leading-relaxed italic">
                              &ldquo;
                              {simulatedReactions?.likely_reply ||
                                analysis.professor_reactions?.likely_reply}
                              &rdquo;
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200 space-y-1.5">
                            <p className="text-xs font-semibold text-amber-950">
                              🟡 Follow-up Question
                            </p>
                            <p className="text-xs text-amber-900 leading-relaxed italic">
                              &ldquo;
                              {simulatedReactions?.followup_question ||
                                analysis.professor_reactions?.followup_question}
                              &rdquo;
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-red-50/80 border border-red-200 space-y-1.5">
                            <p className="text-xs font-semibold text-red-950">
                              🔴 Worst-Case Scenario / Boundary
                            </p>
                            <p className="text-xs text-red-900 leading-relaxed italic">
                              &ldquo;
                              {simulatedReactions?.worst_case_boundary ||
                                analysis.professor_reactions
                                  ?.worst_case_boundary}
                              &rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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

                      {/* Specific Changed Phrases Highlighted (Original Red vs Polished Green) */}
                      {analysis.before_after_highlights?.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-semibold text-slate-800">
                            Key Phrase Upgrades (Original vs. Polished):
                          </p>
                          <div className="space-y-2">
                            {analysis.before_after_highlights.map((item, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-red-800 bg-red-100/80 px-2 py-0.5 rounded font-medium line-through">
                                    Original: &ldquo;{item.original_red}&rdquo;
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
                                  <span className="text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded font-semibold">
                                    Polished: &ldquo;{item.polished_green}&rdquo;
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  {item.reason}
                                </p>
                              </div>
                            ))}
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
