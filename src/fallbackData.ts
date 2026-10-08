/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FallbackParams {
  roughDraft: string;
  persona: string;
  relationship: string;
  situation: string;
  toneStyle: string;
  writerMood?: string;
  platform: string;
  apologyStripper: boolean;
  simplifyLanguage: boolean;
  targetLanguage: string;
  courseOrRefCode?: string;
  studentName?: string;
  professorName?: string;
}

export function isInformalRelationship(relationship: string): boolean {
  const lower = (relationship || "").toLowerCase();
  return (
    lower.includes("bestie") ||
    lower.includes("close friend") ||
    lower.includes("romantic partner") ||
    lower.includes("lover") ||
    lower.includes("family member") ||
    lower.includes("relative") ||
    lower.includes("acquaintance") ||
    lower.includes("roommate") ||
    lower.includes("friend") ||
    lower.includes("crush") ||
    lower.includes("sibling") ||
    lower.includes("cousin")
  );
}

/**
 * Automatically detects the language & script of the user's typed input draft
 * (including native Unicode scripts AND Romanized mother-tongue typing like Hinglish, Tanglish, Tenglish, Spanish, French, etc.)
 */
export function detectInputLanguage(text: string): {
  detectedLabel: string;
  matchedLanguageOption: string;
  isRomanized: boolean;
} {
  const sample = (text || "").trim();
  if (!sample) {
    return {
      detectedLabel: "English (Default)",
      matchedLanguageOption: "English",
      isRomanized: false,
    };
  }

  // 1. Check Unicode script ranges first
  if (/[\u0900-\u097F]/.test(sample)) {
    return {
      detectedLabel: "Hindi (हिन्दी — Devanagari Script)",
      matchedLanguageOption: "Hindi (हिन्दी)",
      isRomanized: false,
    };
  }
  if (/[\u0B80-\u0BFF]/.test(sample)) {
    return {
      detectedLabel: "Tamil (தமிழ் Script)",
      matchedLanguageOption: "Tamil (தமிழ்)",
      isRomanized: false,
    };
  }
  if (/[\u0C00-\u0C7F]/.test(sample)) {
    return {
      detectedLabel: "Telugu (తెలుగు Script)",
      matchedLanguageOption: "Telugu (తెలుగు)",
      isRomanized: false,
    };
  }
  if (/[\u0980-\u09FF]/.test(sample)) {
    return {
      detectedLabel: "Bengali (বাংলা Script)",
      matchedLanguageOption: "Bengali (বাংলা)",
      isRomanized: false,
    };
  }
  if (/[\u0600-\u06FF]/.test(sample)) {
    return {
      detectedLabel: "Arabic (العربية Script)",
      matchedLanguageOption: "Arabic (العربية)",
      isRomanized: false,
    };
  }
  if (/[\u4E00-\u9FFF]/.test(sample)) {
    return {
      detectedLabel: "Mandarin Chinese (中文 Script)",
      matchedLanguageOption: "Mandarin Chinese (中文)",
      isRomanized: false,
    };
  }
  if (/[\u3040-\u30FF]/.test(sample)) {
    return {
      detectedLabel: "Japanese (日本語 Script)",
      matchedLanguageOption: "Japanese (日本語)",
      isRomanized: false,
    };
  }

  // 2. Check Romanized / Transliterated Mother-Tongue markers (Hinglish, Tanglish, Tenglish)
  const words = sample
    .toLowerCase()
    .replace(/[^a-z0-9\s\u00C0-\u017F]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const wordSet = new Set(words);

  const hinglishMarkers = [
    "hai",
    "hain",
    "nahi",
    "nhi",
    "kya",
    "kyu",
    "kyun",
    "mera",
    "meri",
    "mere",
    "aap",
    "tum",
    "aur",
    "bohot",
    "bahut",
    "mein",
    "main",
    "tha",
    "thi",
    "raha",
    "rahi",
    "karo",
    "karna",
    "kal",
    "aaj",
    "abhi",
    "yaar",
    "bhai",
    "mam",
    "zaroori",
    "baat",
    "chahiye",
    "sakta",
    "sakti",
    "thoda",
  ];
  const tanglishMarkers = [
    "irukku",
    "irukka",
    "illa",
    "illai",
    "romba",
    "konjam",
    "eppadi",
    "sollu",
    "sollunga",
    "pannu",
    "panna",
    "mudiyuma",
    "naan",
    "unga",
    "enakku",
    "venum",
    "nandri",
    "vanakkam",
    "machan",
    "da",
    "di",
    "pesalam",
    "pathi",
  ];
  const tenglishMarkers = [
    "undi",
    "unnav",
    "unna",
    "ledu",
    "chala",
    "koncham",
    "nenu",
    "meeru",
    "nuvvu",
    "cheppu",
    "cheppandi",
    "cheyyi",
    "kavali",
    "kosam",
    "gurinchi",
    "ivvagalara",
    "dhanyavadalu",
    "namaskaram",
    "ra",
    "बाबू",
    "matladali",
    "ela",
  ];
  const spanishMarkers = [
    "hola",
    "gracias",
    "por",
    "para",
    "pero",
    "como",
    "estoy",
    "puedo",
    "clase",
    "profesor",
    "examen",
    "porque",
    "necesito",
    "favor",
  ];
  const frenchMarkers = [
    "bonjour",
    "merci",
    "pour",
    "avec",
    "dans",
    "suis",
    "peux",
    "professeur",
    "cours",
    "parce",
    "vous",
    "nous",
  ];

  const countMatches = (list: string[]) =>
    list.filter((w) => wordSet.has(w)).length;

  const hCount = countMatches(hinglishMarkers);
  const taCount = countMatches(tanglishMarkers);
  const teCount = countMatches(tenglishMarkers);
  const esCount = countMatches(spanishMarkers);
  const frCount = countMatches(frenchMarkers);

  if (hCount >= 2 && hCount >= taCount && hCount >= teCount) {
    return {
      detectedLabel: "Hinglish (Romanized Hindi)",
      matchedLanguageOption: "Hinglish (Hindi in English Alphabet)",
      isRomanized: true,
    };
  }
  if (taCount >= 2 && taCount >= hCount && taCount >= teCount) {
    return {
      detectedLabel: "Tanglish (Romanized Tamil)",
      matchedLanguageOption: "Tanglish (Tamil in English Alphabet)",
      isRomanized: true,
    };
  }
  if (teCount >= 2 && teCount >= hCount && teCount >= taCount) {
    return {
      detectedLabel: "Tenglish (Romanized Telugu)",
      matchedLanguageOption: "Tenglish (Telugu in English Alphabet)",
      isRomanized: true,
    };
  }
  if (esCount >= 2) {
    return {
      detectedLabel: "Spanish (Español)",
      matchedLanguageOption: "Spanish (Español)",
      isRomanized: false,
    };
  }
  if (frCount >= 2) {
    return {
      detectedLabel: "French (Français)",
      matchedLanguageOption: "French (Français)",
      isRomanized: false,
    };
  }

  return {
    detectedLabel: "English",
    matchedLanguageOption: "English",
    isRomanized: false,
  };
}

export interface AppFeatureHelpItem {
  id: string;
  title: string;
  howToUse: string;
  whyUseful: string;
  bestForWho: string;
}

export const APP_FEATURES_GUIDE: AppFeatureHelpItem[] = [
  {
    id: "audience_modes",
    title: "1. Inclusive Audience Modes (College, Seniors, Kids, Self-Advocacy & Friendly Chat)",
    howToUse:
      "Click any Audience Mode in the top navigation bar or left sidebar (including 'Friendly Chat' for everyday conversations).",
    whyUseful:
      "Automatically adjusts vocabulary, warmth, and formatting—whether you are emailing a strict professor, questioning a hospital bill as a senior, asking a school teacher for help, or texting your bestie/partner.",
    bestForWho:
      "College students, seniors & elders, school kids, women advocating at work, and friends/partners.",
  },
  {
    id: "mood_and_tone",
    title: "2. Writer Expression / Mood & AI Tone Selector",
    howToUse:
      "Pick how you feel right now (Anxious, Frustrated, Apologetic, Excited, Calm, Confident) and how you want to sound (Ultra Formal, Polite & Direct, Apologetic, Persuasive).",
    whyUseful:
      "When you are stressed or frustrated, raw messages can accidentally sound demanding or panicky. This feature absorbs your emotion and reframes it into calm, persuasive words.",
    bestForWho:
      "Anyone writing a message while stressed, angry, nervous, or overwhelmed.",
  },
  {
    id: "auto_lang",
    title: "3. Auto-Detect Input Language & Transliteration (Hinglish / Tanglish / Tenglish)",
    howToUse:
      "Just start typing in English, Hindi, Tamil, Telugu, Spanish, or Romanized mother tongue (like Hinglish or Tanglish)—the app auto-detects your language, or you can pick any Language/Script in the sidebar!",
    whyUseful:
      "Lets you express your feelings naturally in your own mother tongue (even using English ABC letters) and polishes your message in that exact style.",
    bestForWho:
      "Multilingual students, families, seniors, and friends texting in Hinglish, Tanglish, Tenglish, or global languages.",
  },
  {
    id: "voice_rant",
    title: "4. Voice Note Input ('Rant-to-Email')",
    howToUse:
      "Switch the input toggle from '✍️ Type Text' to '🎤 Record Voice Note' and speak freely out loud.",
    whyUseful:
      "When you are overwhelmed or tired of typing, you can just vent out loud for 15 seconds and the AI turns your spoken rant into a structured, polite message.",
    bestForWho:
      "Stressed students, seniors who prefer speaking over typing, and busy multitaskers.",
  },
  {
    id: "channel_toggle",
    title: "5. Email vs. WhatsApp / Text vs. Slack / Discord Toggle",
    howToUse:
      "Click the channel buttons at the top-right of the workspace.",
    whyUseful:
      "Emails need a formal Subject Line and sign-off, whereas WhatsApp/iMessage and Slack/Discord need shorter, warm, conversational messages without stiff headers.",
    bestForWho:
      "Texting TAs, besties, romantic partners, club leads, or work colleagues.",
  },
  {
    id: "red_flag_and_simulator",
    title: "6. Red Flag Score Meter & Reaction Simulator",
    howToUse:
      "Watch the live score bar under your draft, and click '🧪 Predict Recipient's Reaction' in the output.",
    whyUseful:
      "Shows you why your rough draft might backfire before you hit send, and previews 3 realistic replies (Likely Reply, Follow-Up Question, and Worst-Case Boundary) so you feel prepared.",
    bestForWho:
      "Anyone nervous about how their professor, boss, or partner will react.",
  },
  {
    id: "apology_and_save",
    title: "7. Apology-Stripper & Save / Load Draft",
    howToUse:
      "Check 'Apology-Stripper' in the sidebar, and use 'Save' / 'Load last draft' above the text box.",
    whyUseful:
      "Replaces reflexive 'Sorry to bother you' phrases with confident gratitude ('Thank you for your patience'), and saves your work in your browser so you never lose a draft.",
    bestForWho:
      "Women & self-advocates, students building confidence, and returning users.",
  },
];

export function calculateRawDraftScore(draft: string): number {
  const lower = (draft || "").toLowerCase();
  const casualMarkers = [
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
    "bro",
    "idk",
    "pls",
    "u ",
    "stupid",
  ];
  let hits = 0;
  for (const w of casualMarkers) {
    if (lower.includes(w)) hits++;
  }
  return Math.max(20, Math.min(84, 78 - hits * 11));
}

export function buildFallbackResponse(params: FallbackParams) {
  const {
    roughDraft = "",
    persona = "college_student",
    relationship = "Strict / Formal Professor",
    situation = "Extension Request",
    toneStyle = "Polite & Direct",
    writerMood = "Anxious / Stressed",
    platform = "Email",
    apologyStripper = true,
    simplifyLanguage = false,
    targetLanguage = "English",
    courseOrRefCode = "COMP 101 - Course ID #1042",
    studentName = "",
    professorName = "",
  } = params || {};

  const cleanDraft =
    (roughDraft || "").trim() ||
    "Prof, I'm super overwhelmed, my car broke down and I can't make the 9 AM presentation.";
  const refTag = courseOrRefCode?.trim()
    ? courseOrRefCode.trim()
    : "COMP 101 - Course ID #1042";
  const senderDisplay = studentName?.trim()
    ? studentName.trim()
    : "[Your Name]";
  const isInformal = isInformalRelationship(relationship);
  const recipientDisplay = professorName?.trim()
    ? professorName.trim()
    : isInformal
    ? "[Friend / Partner Name]"
    : persona === "college_student"
    ? "Professor [Last Name]"
    : relationship;

  const rawScore = calculateRawDraftScore(cleanDraft);
  const langLower = (targetLanguage || "English").toLowerCase();

  let subjectLines = isInformal
    ? [
        `Thinking of you / Quick note about ${situation}`,
        `Hey ${recipientDisplay} — wanted to talk openly about ${situation}`,
        `Checking in with you ❤️ (${situation})`,
      ]
    : [
        `[${refTag}] ${situation} - ${senderDisplay}`,
        `[${refTag}] Request Regarding ${situation} - ${senderDisplay}`,
        `Update & Next Steps: ${situation} (${refTag}) - ${senderDisplay}`,
      ];

  let polishedEmail = "";
  let conciseDirect = "";
  let simpleClear = "";

  // Mood-specific framing sentence
  let moodNote =
    "I wanted to share this calmly and constructively so we stay on the same page.";
  if (writerMood.includes("Anxious") || writerMood.includes("Stressed")) {
    moodNote = isInformal
      ? "I've been feeling a bit overwhelmed lately, so I wanted to share this honestly with you instead of bottling it up."
      : "Although this week has been stressful, I am taking full ownership and have put together a clear plan to stay on track.";
  } else if (writerMood.includes("Frustrated")) {
    moodNote = isInformal
      ? "I value our bond too much to let frustration build up unspoken, so I wanted to talk this through gently."
      : "To ensure our expectations and grading criteria are clearly aligned, I would appreciate the chance to review this constructively.";
  } else if (writerMood.includes("Apologetic")) {
    moodNote = isInformal
      ? "I genuinely care about how my actions affect you and want to make things right between us."
      : "I sincerely appreciate your patience and want to make sure my follow-up causes zero extra inconvenience for your schedule.";
  } else if (writerMood.includes("Excited")) {
    moodNote = isInformal
      ? "I'm genuinely excited about what's ahead for us and couldn't wait to share this with you!"
      : "I have thoroughly enjoyed engaging with this material and am eager to contribute my strongest work.";
  } else if (writerMood.includes("Confident")) {
    moodNote = isInformal
      ? "I feel really clear about what works best for both of us moving forward."
      : "I am confident that this proposed timeline will allow me to deliver complete, high-rigor work.";
  }

  // 1. Handle Transliterated / Romanized & Multilingual Styles in Fallback
  if (langLower.includes("hinglish")) {
    subjectLines = isInformal
      ? [
          `Hey ${recipientDisplay} — ek zaroori baat karni thi (${situation})`,
          `Dil se ek choti si baat — ${situation}`,
          `Let's catch up soon! (${situation})`,
        ]
      : [
          `[${refTag}] Request regarding ${situation} - ${senderDisplay}`,
          `[${refTag}] Important Update: ${situation} - ${senderDisplay}`,
          `[${refTag}] Guidance needed for ${situation}`,
        ];

    if (isInformal) {
      polishedEmail = `Hey ${recipientDisplay} ❤️,\n\nKaise ho? Main thoda soch raha/rahi tha about ${situation.toLowerCase()}. Sach bolun toh (${cleanDraft.slice(
        0,
        90
      )}), aur kyunki tum mere liye bahut matter karte ho, main chahta/chahti tha ki hum ispe openly aur pyaar se baat karein.\n\n${moodNote} Jab bhi free ho toh call ya text karna, milke sort out karte hain! ✨\n\nLots of love,\n${senderDisplay}`;
      conciseDirect = `Hey ${recipientDisplay}! Bas ${situation.toLowerCase()} ke baare mein ek quick baat karni thi (${cleanDraft.slice(
        0,
        70
      )}). Jab time mile toh batao, aaram se baat karte hain! — ${senderDisplay}`;
      simpleClear = `Hi ${recipientDisplay}, mujhe aapse ${situation.toLowerCase()} ke baare mein dil se baat karni thi. Koi rush nahi hai, jab aap free ho toh please batana. — ${senderDisplay}`;
    } else {
      polishedEmail = `Dear ${recipientDisplay},\n\nAasha hai aapki week acchi ja rahi hogi. Main aapke ${refTag} class se ${senderDisplay} bol raha/rahi hoon, aur main ${situation.toLowerCase()} ke regarding request karna chahta/chahti hoon.\n\nActually ek unexpected problem aa gayi thi (${cleanDraft.slice(
        0,
        95
      )}), par main apne coursework ko lekar poori tarah serious hoon. Kya mujhe Friday 5:00 PM tak ka short extension mil sakta hai, ya main office hours mein aapse mil sakta/sakti hoon?\n\nAapke time aur support ke liye bahut-bahut thank you!\n\nWarm regards,\n${senderDisplay}\n${refTag}`;
      conciseDirect = `Dear ${recipientDisplay},\n\nMain ${refTag} se ${senderDisplay} hoon. ${situation} ke regarding ek choti si request thi (${cleanDraft.slice(
        0,
        75
      )}). Kya main apna kaam Friday 5 PM tak submit kar sakta/sakti hoon? Thank you so much!\n\nBest regards,\n${senderDisplay}`;
      simpleClear = `Hello ${recipientDisplay}, main ${refTag} mein student hoon. Mujhe ${situation.toLowerCase()} mein thodi madad chahiye. Please batayein next step kya sahi rahega. Thank you! — ${senderDisplay}`;
    }
  } else if (langLower.includes("tanglish")) {
    if (isInformal) {
      polishedEmail = `Hey ${recipientDisplay} ✨,\n\nEppadi irukka? ${situation} pathi un kitta konjam open-ah pesanum nu nenaichen. (${cleanDraft.slice(
        0,
        85
      )}). Namma friendship enakku romba mukkiyam, adhaan calm-ah pesi solve pannalam nu message pannen.\n\nFree-ah irukkum bodhu text pannu, pesalam! ❤️\n— ${senderDisplay}`;
      conciseDirect = `Hey ${recipientDisplay}! ${situation} pathi oru chinna vishayam pesanum. Free aana udane ping pannu! — ${senderDisplay}`;
      simpleClear = `Hi ${recipientDisplay}, ${situation} pathi konjam pesanum. Time kidaikkum bodhu sollu, pesalam. Nandri! — ${senderDisplay}`;
    } else {
      polishedEmail = `Dear ${recipientDisplay},\n\nVanakkam! Naan unga ${refTag} class-la padikkira ${senderDisplay}. ${situation} sambanthama oru polite request veikkanum nu indha message anuppuren.\n\nEdhirparatha vidhama oru chinna chikkal aayiduchu (${cleanDraft.slice(
        0,
        85
      )}). Ennoda work-ah Friday 5:00 PM kulla complete panni submit panna permission kidaikkuma? Illana office hours-la vandhu paarkava?\n\nUnga time matrum udhavikku romba nandri!\n\nBest regards,\n${senderDisplay}\n${refTag}`;
      conciseDirect = `Dear ${recipientDisplay}, naan ${refTag}-la irundhu ${senderDisplay}. ${situation} kaaga Friday 5 PM varai chinna extension kidaikkuma? Romba nandri! — ${senderDisplay}`;
      simpleClear = `Hello ${recipientDisplay}, naan ${refTag} student. Enakku ${situation} vishayathula unga guidance venum. Romba nandri! — ${senderDisplay}`;
    }
  } else if (langLower.includes("tenglish")) {
    if (isInformal) {
      polishedEmail = `Hey ${recipientDisplay} ❤️,\n\nEla unnav? ${situation} gurinchi nee tho koncham open ga matladali anukunnanu (${cleanDraft.slice(
        0,
        85
      )}). Mana bond naaku chala important kabatti, calm ga matladukuni sort cheddam.\n\nFree ga unnappudu call ledha text cheyyi! ✨\n— ${senderDisplay}`;
      conciseDirect = `Hey ${recipientDisplay}! ${situation} gurinchi oka chinna mata cheppali. Free ayyaka ping cheyyi! — ${senderDisplay}`;
      simpleClear = `Hi ${recipientDisplay}, ${situation} gurinchi koncham matladali. Time unnappudu cheppu. Thanks! — ${senderDisplay}`;
    } else {
      polishedEmail = `Dear ${recipientDisplay},\n\nNamaskaram! Nenu mee ${refTag} class student ${senderDisplay} ni. ${situation} gurinchi oka polite request cheddamani ee email rastunnanu.\n\nOka unexpected situation valla (${cleanDraft.slice(
        0,
        85
      )}) chinna delay ayyindi. Dayachesi Friday 5:00 PM varaku short extension ivvagalara, leda office hours lo kalavacha?\n\nMee time mariyu guidance ki chala dhanyavadalu!\n\nBest regards,\n${senderDisplay}\n${refTag}`;
      conciseDirect = `Dear ${recipientDisplay}, nenu ${refTag} nundi ${senderDisplay}. ${situation} kosam Friday 5 PM varaku extension ivvagalara? Thank you so much! — ${senderDisplay}`;
      simpleClear = `Hello ${recipientDisplay}, nenu ${refTag} student ni. ${situation} vishayam lo mee salahaa kavali. Dhanyavadalu! — ${senderDisplay}`;
    }
  } else if (isInformal) {
    // 2. Informal / Personal Relationship Messaging (Bestie, Close Friend, Romantic Partner / Lover, Family, Acquaintance)
    const relLower = relationship.toLowerCase();
    if (relLower.includes("romantic") || relLower.includes("lover")) {
      polishedEmail = `Hey love ❤️ — I wanted to talk to you openly about ${situation.toLowerCase()}. Here's what's been on my mind: ${cleanDraft}\n\n${moodNote} You mean so much to me, and I really want us to feel heard and connected. Can we talk about this tonight when we're both free?`;
      conciseDirect = `Hey ❤️ — been thinking about ${situation.toLowerCase()} (${cleanDraft.slice(
        0,
        80
      )}). I really care about us and want to talk it through warmly tonight. Free after 7?`;
      simpleClear = `Hi love, I'd really like to talk gently with you about ${situation.toLowerCase()}. No pressure or rush—let me know when is a good time for us to chat ❤️`;
    } else if (relLower.includes("bestie") || relLower.includes("close friend")) {
      polishedEmail = `Hey ${recipientDisplay}! 💛 Wanted to be totally honest with you about ${situation.toLowerCase()}. Basically: ${cleanDraft}\n\n${moodNote} You're one of my favorite people and I never want weirdness between us—let's catch up soon!`;
      conciseDirect = `Hey ${recipientDisplay}! Quick honest note about ${situation.toLowerCase()}: ${cleanDraft.slice(
        0,
        85
      )}. Love our friendship and just wanted to keep things super clear between us! ✨`;
      simpleClear = `Hey ${recipientDisplay}, just wanted to check in with you as a close friend about ${situation.toLowerCase()}. Let's chat whenever you have a few minutes!`;
    } else if (relLower.includes("family") || relLower.includes("relative")) {
      polishedEmail = `Hi ${recipientDisplay},\n\nHope you're doing well! I wanted to reach out warmly about ${situation.toLowerCase()}. ${cleanDraft}\n\n${moodNote} Thank you so much for always being there for me—let me know when is a good time for a quick phone call!\n\nWith love,\n${senderDisplay}`;
      conciseDirect = `Hi ${recipientDisplay} — checking in about ${situation.toLowerCase()} (${cleanDraft.slice(
        0,
        85
      )}). Would love to talk this through whenever you have a quiet moment. Love, ${senderDisplay}`;
      simpleClear = `Hi ${recipientDisplay}, I wanted to share a quick update with you about ${situation.toLowerCase()}. Please call me when you are free. Love, ${senderDisplay}`;
    } else {
      polishedEmail = `Hi ${recipientDisplay} 👋 — hope your week is going great! Wanted to reach out thoughtfully regarding ${situation.toLowerCase()}: ${cleanDraft}\n\n${moodNote} Let me know what works best on your end! — ${senderDisplay}`;
      conciseDirect = `Hi ${recipientDisplay}! Quick note regarding ${situation.toLowerCase()} (${cleanDraft.slice(
        0,
        80
      )}). Let me know your thoughts when you get a chance! — ${senderDisplay}`;
      simpleClear = `Hi ${recipientDisplay}, hope all is well! Reaching out about ${situation.toLowerCase()}—let me know what works best for you. Thanks!`;
    }
  } else if (platform === "WhatsApp / Text Message") {
    polishedEmail = `Hi ${recipientDisplay} — this is ${senderDisplay} from ${refTag}. I wanted to reach out promptly regarding ${situation.toLowerCase()}. ${cleanDraft.slice(
      0,
      100
    )}... ${moodNote} Would it be possible to submit by Friday at 5:00 PM or connect briefly during office hours? Thank you so much for your understanding!`;
    conciseDirect = `Hi ${recipientDisplay}, ${senderDisplay} (${refTag}) here. Writing regarding ${situation.toLowerCase()}. Could I submit by Friday at 5 PM or stop by office hours tomorrow? Thank you!`;
    simpleClear = `Hello ${recipientDisplay}, this is ${senderDisplay} in ${refTag}. I need a quick hand with ${situation.toLowerCase()}. Please let me know the best next step when you have a moment. Thank you!`;
  } else if (platform === "Slack / Discord") {
    polishedEmail = `Hi @${recipientDisplay} 👋 — reaching out from **${refTag}** regarding **${situation}**.\n• **Update:** I encountered an unexpected issue (${cleanDraft.slice(
      0,
      100
    )}) and want to ensure I stay aligned with our milestones.\n• **Context:** ${moodNote}\n• **Proposed Plan:** Would a brief extension until **Friday at 5:00 PM** work, or could I jump into office hours tomorrow?\nThanks so much for your time and guidance! — ${senderDisplay}`;
    conciseDirect = `Hi @${recipientDisplay} — quick update for **${refTag}** (${situation}): ran into a blocker (${cleanDraft.slice(
      0,
      80
    )}). Can I submit by Friday 5 PM or sync in office hours? Thanks!`;
    simpleClear = `Hi @${recipientDisplay} — writing from **${refTag}** about **${situation}**. I want to make sure I do this right. Could you let me know the best next step? Thank you!`;
  } else {
    let greeting = `Dear ${recipientDisplay},`;
    let leadIn = `I hope your week is going well. I am a student in your ${refTag} course, and I am writing regarding ${situation.toLowerCase()}.`;
    let bodyParagraph = `Specifically, I want to take full responsibility for my coursework while sharing a brief update: I encountered an unexpected challenge (${cleanDraft}), and I want to make sure I meet your standards for the class. ${moodNote}`;
    let askParagraph = `If your syllabus policy permits, would you be open to granting a brief extension until Friday at 5:00 PM, or could I stop by your office hours to discuss the best way forward? I have already started the work and am committed to submitting a thorough assignment.`;
    let signOff = "Best regards,";

    if (toneStyle === "Ultra Formal") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope this message finds you well. I am writing as an enrolled student in ${refTag} to formally request your consideration regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `While I remain fully committed to upholding the academic standards of ${refTag}, I experienced an unforeseen circumstance (${cleanDraft}) that has impacted my schedule. ${moodNote}`;
      askParagraph = `Should course policy allow, I would be deeply grateful for the opportunity to submit my completed work by Friday at 5:00 PM, or to consult with you during your next scheduled office hours.`;
      signOff = "Respectfully yours,";
    } else if (toneStyle === "Apologetic") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope you are well, and I sincerely apologize for the timing of this note. I am a student in your ${refTag} class writing regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `I regret to share that I ran into a difficult situation (${cleanDraft}), and I feel bad about any inconvenience this causes for your grading schedule. ${moodNote}`;
      askParagraph = `If at all possible, would you consider allowing me to make this up or submit by Friday at 5:00 PM? I truly appreciate your patience and understanding.`;
      signOff = "With sincere apologies and appreciation,";
    } else if (toneStyle === "Persuasive") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope your week is going well. Because I have gained so much from your lectures in ${refTag} and want my submission to reflect my strongest analytical work, I am writing with a proactive proposal regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `Due to a temporary setback (${cleanDraft}), submitting tonight would compromise the rigor of my work—whereas 48 additional hours will allow me to incorporate the full dataset and rubric criteria. ${moodNote}`;
      askParagraph = `Would you be open to accepting my completed submission by Friday at 5:00 PM, or reviewing my current outline during office hours tomorrow?`;
      signOff = "With appreciation,";
    }

    if (persona === "seniors") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope this note finds you well. I am writing to request clear, straightforward assistance regarding ${situation.toLowerCase()} (Reference: ${refTag}).`;
      bodyParagraph = `Here is what happened: ${cleanDraft}\n\n${moodNote}`;
      askParagraph = `Could you please explain the next steps in plain language, or let me know the best direct phone number and time for us to speak? Thank you for your patience and help.`;
    } else if (persona === "school_kids") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope you are having a great week! I am in ${refTag} and am writing to ask for your help with ${situation.toLowerCase()}.`;
      bodyParagraph = `Here is what happened: ${cleanDraft}\n\n${moodNote}`;
      askParagraph = `I really want to do my best and catch up. Could you please let me know what steps I should take next, or if we can talk briefly after class tomorrow?`;
    } else if (persona === "women_advocacy") {
      greeting = `Hi ${recipientDisplay},`;
      leadIn = `Thank you for your collaboration on ${refTag}. I am writing to align on ${situation.toLowerCase()}.`;
      bodyParagraph = `To protect the quality and timeline of our core priorities (${cleanDraft}), I want to propose a clear and sustainable boundary moving forward. ${moodNote}`;
      askParagraph = `Let's review the scope on Thursday so our highest-impact deliverables stay on track. Thank you for your partnership.`;
    }

    polishedEmail = `${greeting}\n\n${leadIn}\n\n${bodyParagraph}\n\n${askParagraph}\n\nThank you very much for your time, consideration, and guidance.\n\n${signOff}\n${senderDisplay}\n${refTag}`;
    conciseDirect = `${greeting}\n\nI am writing from ${refTag} regarding ${situation.toLowerCase()}. Due to an unexpected challenge (${cleanDraft.slice(
      0,
      85
    )}), could I please submit by Friday at 5:00 PM or discuss this during office hours?\n\nThank you for your time and consideration.\n\n${signOff}\n${senderDisplay}`;
    simpleClear = `${greeting}\n\nI am in ${refTag}. I am working hard on ${situation.toLowerCase()}, but I ran into a tough spot: ${cleanDraft}\n\nCould I please have until Friday at 5:00 PM to turn in my best work, or visit your office hours for advice? Thank you for understanding.\n\nSincerely,\n${senderDisplay}`;
  }

  return {
    transcribed_text: cleanDraft,
    subject_line: subjectLines[0],
    subject_lines: subjectLines,
    polished_email: simplifyLanguage ? simpleClear : polishedEmail,
    platform_used: platform,
    tone_used: toneStyle,
    mood_used: writerMood,
    language_used: targetLanguage,
    readiness_scorecard: {
      raw_professionalism_score: rawScore,
      raw_professionalism_label:
        rawScore < 55
          ? "Emotional / Unfiltered — Needs Polish"
          : "Moderate — Can Be Stronger",
      clarity_score: 94,
      clarity_delta: "+34%",
      politeness_score: 97,
      politeness_delta: "+50%",
      tone_warning_status: "Safe to Send 🟢",
    },
    before_after_highlights: [
      {
        original_red: `Raw (${writerMood}): "${cleanDraft.slice(0, 50)}..."`,
        polished_green: isInformal
          ? `Warm & Natural Opening for ${relationship}`
          : `Dear ${recipientDisplay}, I am writing from [${refTag}] regarding ${situation.toLowerCase()}...`,
        reason: `Reframes your '${writerMood}' emotion into a warm, constructive opening tailored for ${relationship}.`,
      },
      {
        original_red: cleanDraft.slice(0, 65),
        polished_green: moodNote,
        reason:
          "Transforms raw stress, frustration, or hesitation into empathetic, solution-focused communication.",
      },
      {
        original_red: "can we fix this? sorry to bother you",
        polished_green: isInformal
          ? "Let's talk when we're both free—I really value our bond ❤️"
          : "Would you be open to granting a brief extension until Friday at 5:00 PM? Thank you for your consideration.",
        reason:
          "Proposes a concrete, low-friction next step and swaps self-deprecation for warm appreciation.",
      },
    ],
    versions: {
      warm_respectful: polishedEmail,
      concise_direct: conciseDirect,
      simple_clear: simpleClear,
    },
    etiquette_lessons: [
      {
        principle: isInformal
          ? `Warm Conversational Framing for ${relationship}`
          : "3-Part Subject Line Formula ([Course Code] + Situation + Name)",
        before_snippet: "(Abrupt opening or emotional text dump)",
        after_snippet: subjectLines[0],
        why_it_works: isInformal
          ? `When messaging a ${relationship}, leading with warmth and validation prevents defensiveness and keeps your bond strong.`
          : "Professors get dozens of emails daily. Leading with [COMP 101] and your Course ID lets them filter and reply in seconds.",
        simple_kid_friendly_tip:
          "Starting with a kind, clear label or greeting helps the other person smile and understand you right away!",
      },
      {
        principle: `Reframing '${writerMood}' Mood into '${toneStyle}' Tone`,
        before_snippet: cleanDraft.slice(0, 75),
        after_snippet: moodNote,
        why_it_works: `Acknowledges your '${writerMood}' feelings without projecting blame or panic onto the recipient.`,
        simple_kid_friendly_tip:
          "Even when we feel stressed or upset inside, using calm words helps the other person listen with an open heart.",
      },
      {
        principle: `Natural ${targetLanguage} & Channel Fit (${platform})`,
        before_snippet: "What should I do now? / Can you help me?",
        after_snippet: isInformal
          ? "Let's chat tonight when we're both free!"
          : "Would you be open to granting a brief extension until Friday at 5:00 PM?",
        why_it_works:
          "Offering a specific, low-pressure next step makes it effortless for the recipient to say 'Yes!'",
        simple_kid_friendly_tip:
          "Suggest a fair plan so the other person can easily agree and help you!",
      },
    ],
    tone_analysis: {
      overall_tone_summary: `Detected writer mood: '${writerMood}'. Your raw draft scored ${rawScore}% before refinement. After calibrating for ${relationship} with a '${toneStyle}' tone in ${targetLanguage} on ${platform}, Clarity rose to 94% (+34%) and Warmth/Politeness reached 97% (+50%).`,
      warmth_score: 94,
      clarity_score: 94,
      assertiveness_score: apologyStripper ? 93 : 88,
      respect_score: 97,
      flags: [
        {
          type: `Emotional Spillover (${writerMood})`,
          severity: "medium",
          flagged_phrase: cleanDraft.slice(0, 60),
          issue_explanation: `Writing while feeling '${writerMood}' can unintentionally sound reactive, rushed, or overly self-blaming.`,
          suggested_fix: moodNote,
        },
        {
          type: isInformal
            ? "Risk of Sounding Either Too Stiff or Accusatory"
            : "Missing Course / Reference Identifier",
          severity: "low",
          flagged_phrase: "Message Opening & Sign-Off",
          issue_explanation: isInformal
            ? `With a ${relationship}, overly formal email language feels cold, while raw ranting can trigger defensiveness.`
            : "Faculty and support staff handle hundreds of requests; omitting your course or reference code slows down their reply.",
          suggested_fix: isInformal
            ? "Use warm 'I feel / I value us' language and invite a low-pressure chat."
            : `Include "${subjectLines[0]}" in the subject line and state your section in line 1.`,
        },
      ],
      missing_details_checklist: isInformal
        ? [
            `Replace ${recipientDisplay} with their real name or nickname`,
            "Double-check that your message uses 'I feel' instead of 'You always'",
            "Send when you both have a calm moment to reply",
          ]
        : [
            `Confirm exact Course Code & Section (${refTag})`,
            `Verify recipient name (${recipientDisplay}) and your signature (${senderDisplay})`,
            "Attach doctor's note or supporting documentation if requesting an exam make-up",
          ],
      apology_audit: {
        unnecessary_apologies_found: cleanDraft.toLowerCase().includes("sorry")
          ? 2
          : 1,
        coaching_note:
          "Replaced self-undermining apologies ('sorry to bother you') with confident, warm appreciation.",
      },
    },
    professor_reactions: isInformal
      ? {
          likely_reply: `Hey ❤️ thank you so much for being honest with me and saying it so kindly. I really care about you too—let's definitely talk tonight!`,
          followup_question: `Thanks for telling me how you're feeling! Are you free around 7 PM for a quick call so we can talk it through properly?`,
          worst_case_boundary: `I hear where you're coming from, though I'm still processing things on my end. Can we take a little space today and chat tomorrow?`,
        }
      : {
          likely_reply: `Hi ${senderDisplay}, thank you for letting me know ahead of time and proposing a clear timeline. Please go ahead and submit by Friday at 5:00 PM without penalty. Best, ${recipientDisplay}`,
          followup_question: `Hi ${senderDisplay}, thanks for reaching out. Could you please forward a brief note from the health clinic or advisor, and confirm which lab section you are registered in?`,
          worst_case_boundary: `Dear ${senderDisplay}, while I understand this week has been challenging, please consult the course syllabus regarding missed deadlines. Extensions require formal documentation through Student Services.`,
        },
    using_fallback: true,
  };
}

export const SIMPLE_WORD_GLOSSARY: Record<
  string,
  { simpleMeaning: string; exampleUse: string; kidAndSeniorTip: string }
> = {
  syllabus: {
    simpleMeaning:
      "The class rulebook and schedule your teacher or professor hands out on the first day.",
    exampleUse:
      "\"If your syllabus policy permits, could I have a short extension?\"",
    kidAndSeniorTip:
      "Always check the syllabus first—it tells you exam dates, grading rules, and office hours!",
  },
  "office hours": {
    simpleMeaning:
      "Special times each week when a professor sits in their office (or on Zoom) just to help students one-on-one.",
    exampleUse: "\"Could I stop by your office hours on Tuesday at 2:00 PM?\"",
    kidAndSeniorTip:
      "You don't need to be failing to visit office hours—professors love when students stop by to ask questions!",
  },
  extension: {
    simpleMeaning:
      "Extra time to finish and turn in your homework or project without losing points.",
    exampleUse:
      "\"Would you be open to granting a 48-hour extension until Friday?\"",
    kidAndSeniorTip:
      "Ask for an extension as early as possible and suggest a specific new day and time.",
  },
  rubric: {
    simpleMeaning:
      "A checklist that shows exactly how your teacher grades an assignment and where points come from.",
    exampleUse:
      "\"I reviewed the grading rubric and wanted to ask how I can improve next time.\"",
    kidAndSeniorTip:
      "Instead of saying 'My grade is unfair,' ask to look at the rubric together!",
  },
  transliteration: {
    simpleMeaning:
      "Typing words from your native mother tongue (like Hindi, Tamil, or Telugu) using English ABC letters—like 'Hinglish' or 'Tanglish'!",
    exampleUse: "\"Kaise ho? Main kal class nahi aa paunga.\"",
    kidAndSeniorTip:
      "Use Hinglish, Tanglish, or Tenglish in the Language menu when texting close friends or family!",
  },
  mitigating: {
    simpleMeaning:
      "Unexpected real-life problems (like getting sick or a family emergency) that make something harder.",
    exampleUse:
      "\"Due to unforeseen circumstances this week, I wanted to reach out early.\"",
    kidAndSeniorTip:
      "You can just say 'an unexpected problem' instead of big fancy words!",
  },
  salutation: {
    simpleMeaning:
      "The polite greeting at the very start of your message (like 'Dear Professor Smith,').",
    exampleUse: "\"Dear Professor Chen,\" or \"Hello Dr. Patel,\"",
    kidAndSeniorTip:
      "Starting with 'Dear...' instead of 'Hey!' makes people much happier to help you.",
  },
  accommodate: {
    simpleMeaning: "To make room for someone's needs or help them out.",
    exampleUse:
      "\"Thank you so much for accommodating my schedule request.\"",
    kidAndSeniorTip:
      "It simply means helping someone adjust when life gets tricky.",
  },
};

export function buildRoboFallbackReply(userMessage: string): {
  reply: string;
  wordBreakdown?: {
    word: string;
    simpleMeaning: string;
    exampleUse: string;
    kidAndSeniorTip: string;
  };
  suggestedFollowups: string[];
} {
  const clean = (userMessage || "").trim();
  const lower = clean.toLowerCase();

  for (const [term, info] of Object.entries(SIMPLE_WORD_GLOSSARY)) {
    if (lower.includes(term)) {
      return {
        reply: `Beep-boop! 🤖 Let me explain **"${term}"** in super simple words:\n\n• **What it means:** ${info.simpleMeaning}\n• **How to use it:** ${info.exampleUse}\n• **Friendly Tip:** ${info.kidAndSeniorTip}`,
        wordBreakdown: {
          word: term,
          ...info,
        },
        suggestedFollowups: [
          "How do I use this app step-by-step?",
          "How is the Mood or Tone selector useful for me?",
          "What does 'transliteration' mean?",
        ],
      };
    }
  }

  // How to use the app step-by-step
  if (
    lower.includes("how to use") ||
    lower.includes("use this app") ||
    lower.includes("step-by-step") ||
    lower.includes("guide") ||
    lower.includes("how does this work")
  ) {
    return {
      reply:
        "Beep-boop! 🤖 Here is how to use **Say It Right** in 3 super easy steps:\n\n" +
        "1. **Pick Your Mode & Situation (Left Sidebar):** Choose who you are (*College Student*, *Seniors*, *School Kids*, *Self-Advocacy*, or *Friendly Chat*) and pick your relationship & situation (like *General* or *Extension Request*).\n" +
        "2. **Type or Speak Your Raw Thoughts:** Type in ANY language (even Hinglish/Tanglish!) or tap **🎤 Record Voice Note** to speak out loud. We automatically detect your typed language!\n" +
        "3. **Generate, Learn & Copy:** Click **Generate Polished Draft & Learn** to get a ready-to-send message, 3 subject lines, etiquette tips, and simulated replies!",
      suggestedFollowups: [
        "How is each feature useful for me?",
        "How does Auto-Detect Language work?",
        "How is Friendly Chat mode useful?",
        "What does 'syllabus' mean?",
      ],
    };
  }

  // How any feature is useful for the user
  if (
    lower.includes("feature") ||
    lower.includes("useful") ||
    lower.includes("benefit") ||
    lower.includes("help me") ||
    lower.includes("mood") ||
    lower.includes("voice") ||
    lower.includes("simulator") ||
    lower.includes("friendly chat")
  ) {
    return {
      reply:
        "Beep-boop! 🌟 Every feature in **Say It Right** is built to save you stress and help people say 'Yes!' to you:\n\n" +
        "• **Writer Mood & Tone Selector:** Useful when you feel anxious or frustrated—it removes panic or blame so you sound calm and confident.\n" +
        "• **Friendly Chat & General Mode:** Useful for everyday texts to your Bestie, Romantic Partner, or Family on WhatsApp without stiff email headers.\n" +
        "• **Auto-Detect Language & Hinglish/Tanglish:** Useful when you think best in your mother tongue using English letters—it detects your language automatically!\n" +
        "• **Voice Note ('Rant-to-Email') & Large Text:** Useful for Seniors, Kids, or stressed students who prefer talking out loud instead of typing.\n" +
        "• **Reaction Simulator:** Useful for previewing 3 realistic replies before you hit send!",
      suggestedFollowups: [
        "How do I use this app step-by-step?",
        "How does Hinglish / Tanglish work?",
        "Should I say 'sorry' in my email?",
        "What does 'rubric' mean?",
      ],
    };
  }

  if (
    lower.includes("hinglish") ||
    lower.includes("tanglish") ||
    lower.includes("language") ||
    lower.includes("auto")
  ) {
    return {
      reply:
        "Beep-boop! 🌍 **Auto-Detect Language** watches as you type! Whether you type in English, Hindi, Tamil, Telugu, Spanish, or Romanized mother tongue (**Hinglish**, **Tanglish**, **Tenglish**), the app automatically detects your input language and can polish your message in that exact style!",
      suggestedFollowups: [
        "How is each feature useful for me?",
        "What does 'transliteration' mean?",
        "How do I use Friendly Chat mode?",
      ],
    };
  }

  if (lower.includes("mean") || lower.includes("define") || lower.includes("word")) {
    return {
      reply:
        "Beep-boop! 🤖 I love explaining tricky words in plain English! Whenever someone uses a big academic or medical word, it just means they want to sound formal—you can always ask me any specific word (like *syllabus*, *rubric*, *extension*, *office hours*, or *transliteration*) and I will break it down simply for you!",
      suggestedFollowups: [
        "What does 'syllabus' mean?",
        "What does 'rubric' mean?",
        "How is each feature useful for me?",
      ],
    };
  }

  if (lower.includes("sorry") || lower.includes("apolog")) {
    return {
      reply:
        "Great question! 🤖 You only need to say **'I apologize'** if you accidentally broke a promise or missed a meeting without warning. If you are just asking a question, asking for help, or sick, our **Apology-Stripper** feature swaps *'Sorry to bother you'* for **'Thank you so much for your time and help!'** so you sound warm and confident!",
      suggestedFollowups: [
        "How is each feature useful for me?",
        "How do I use this app step-by-step?",
        "What does 'syllabus' mean?",
      ],
    };
  }

  return {
    reply:
      "Hi friend! I'm **Bibo**, your friendly communication & app guide buddy! 🤖✨\n\nI can help you:\n1. **Show you how to use this app** step-by-step and explain **how every feature is useful for you**.\n2. **Explain any difficult word** in plain, everyday language.\n3. **Clear up doubts** about messaging professors, doctors, teachers, besties, or partners.\n\nTap the **'App Guide & Features'** tab above or click a quick question below!",
    suggestedFollowups: [
      "How do I use this app step-by-step?",
      "How is each feature useful for me?",
      "What does 'syllabus' mean?",
      "How does Auto-Detect Language work?",
    ],
  };
}
