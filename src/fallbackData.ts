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
  platform: string;
  apologyStripper: boolean;
  simplifyLanguage: boolean;
  targetLanguage: string;
  courseOrRefCode?: string;
  studentName?: string;
  professorName?: string;
}

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
    platform = "Email",
    apologyStripper = true,
    simplifyLanguage = false,
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
    : "[Your Full Name]";
  const recipientDisplay = professorName?.trim()
    ? professorName.trim()
    : persona === "college_student"
    ? "Professor [Last Name]"
    : relationship;

  const rawScore = calculateRawDraftScore(cleanDraft);

  const subjectLines = [
    `[${refTag}] ${situation} - ${senderDisplay}`,
    `[${refTag}] Request Regarding ${situation} - ${senderDisplay}`,
    `Update & Next Steps: ${situation} (${refTag}) - ${senderDisplay}`,
  ];

  let polishedEmail = "";
  let conciseDirect = "";
  let simpleClear = "";

  if (platform === "WhatsApp / Text Message") {
    polishedEmail = `Hi ${recipientDisplay} — this is ${senderDisplay} from ${refTag}. I wanted to reach out promptly regarding ${situation.toLowerCase()}. ${cleanDraft.slice(
      0,
      100
    )}... Would it be possible to submit by Friday at 5:00 PM or connect briefly during office hours? Thank you so much for your understanding!`;
    conciseDirect = `Hi ${recipientDisplay}, ${senderDisplay} (${refTag}) here. Writing regarding ${situation.toLowerCase()}. Could I submit by Friday at 5 PM or stop by office hours tomorrow? Thank you!`;
    simpleClear = `Hello ${recipientDisplay}, this is ${senderDisplay} in ${refTag}. I need a quick hand with ${situation.toLowerCase()}. Please let me know the best next step when you have a moment. Thank you!`;
  } else if (platform === "Slack / Discord") {
    polishedEmail = `Hi @${recipientDisplay} 👋 — reaching out from **${refTag}** regarding **${situation}**.\n• **Update:** I encountered an unexpected issue (${cleanDraft.slice(
      0,
      100
    )}) and want to ensure I stay aligned with our course milestones.\n• **Proposed Plan:** Would a brief extension until **Friday at 5:00 PM** work, or could I jump into office hours tomorrow?\nThanks so much for your time and guidance! — ${senderDisplay}`;
    conciseDirect = `Hi @${recipientDisplay} — quick update for **${refTag}** (${situation}): ran into a blocker (${cleanDraft.slice(
      0,
      80
    )}). Can I submit by Friday 5 PM or sync in office hours? Thanks!`;
    simpleClear = `Hi @${recipientDisplay} — writing from **${refTag}** about **${situation}**. I want to make sure I do this right. Could you let me know the best next step? Thank you!`;
  } else {
    let greeting = `Dear ${recipientDisplay},`;
    let leadIn = `I hope your week is going well. I am a student in your ${refTag} course, and I am writing regarding ${situation.toLowerCase()}.`;
    let bodyParagraph = `Specifically, I want to take full responsibility for my coursework while sharing a brief update: I encountered an unexpected challenge (${cleanDraft}), and I want to make sure I meet your standards for the class.`;
    let askParagraph = `If your syllabus policy permits, would you be open to granting a brief extension until Friday at 5:00 PM, or could I stop by your office hours to discuss the best way forward? I have already started the work and am committed to submitting a thorough assignment.`;
    let signOff = "Best regards,";

    if (toneStyle === "Ultra Formal") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope this message finds you well. I am writing as an enrolled student in ${refTag} to formally request your consideration regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `While I remain fully committed to upholding the academic standards of ${refTag}, I experienced an unforeseen circumstance (${cleanDraft}) that has impacted my schedule.`;
      askParagraph = `Should course policy allow, I would be deeply grateful for the opportunity to submit my completed work by Friday at 5:00 PM, or to consult with you during your next scheduled office hours.`;
      signOff = "Respectfully yours,";
    } else if (toneStyle === "Apologetic") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope you are well, and I sincerely apologize for the timing of this note. I am a student in your ${refTag} class writing regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `I regret to share that I ran into a difficult situation (${cleanDraft}), and I feel bad about any inconvenience this causes for your grading schedule.`;
      askParagraph = `If at all possible, would you consider allowing me to make this up or submit by Friday at 5:00 PM? I truly appreciate your patience and understanding.`;
      signOff = "With sincere apologies and appreciation,";
    } else if (toneStyle === "Persuasive") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope your week is going well. Because I have gained so much from your lectures in ${refTag} and want my submission to reflect my strongest analytical work, I am writing with a proactive proposal regarding ${situation.toLowerCase()}.`;
      bodyParagraph = `Due to a temporary setback (${cleanDraft}), submitting tonight would compromise the rigor of my work—whereas 48 additional hours will allow me to incorporate the full dataset and rubric criteria.`;
      askParagraph = `Would you be open to accepting my completed submission by Friday at 5:00 PM, or reviewing my current outline during office hours tomorrow?`;
      signOff = "With appreciation,";
    }

    if (persona === "seniors") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope this note finds you well. I am writing to request clear, straightforward assistance regarding ${situation.toLowerCase()} (Reference: ${refTag}).`;
      bodyParagraph = `Here is what happened: ${cleanDraft}`;
      askParagraph = `Could you please explain the next steps in plain language, or let me know the best direct phone number and time for us to speak? Thank you for your patience and help.`;
    } else if (persona === "school_kids") {
      greeting = `Dear ${recipientDisplay},`;
      leadIn = `I hope you are having a great week! I am in ${refTag} and am writing to ask for your help with ${situation.toLowerCase()}.`;
      bodyParagraph = `Here is what happened: ${cleanDraft}`;
      askParagraph = `I really want to do my best and catch up. Could you please let me know what steps I should take next, or if we can talk briefly after class tomorrow?`;
    } else if (persona === "women_advocacy") {
      greeting = `Hi ${recipientDisplay},`;
      leadIn = `Thank you for your collaboration on ${refTag}. I am writing to align on ${situation.toLowerCase()}.`;
      bodyParagraph = `To protect the quality and timeline of our core priorities (${cleanDraft}), I want to propose a clear and sustainable boundary moving forward.`;
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
    readiness_scorecard: {
      raw_professionalism_score: rawScore,
      raw_professionalism_label:
        rawScore < 55
          ? "Casual / Stressed — Needs Polish"
          : "Moderate — Can Be Stronger",
      clarity_score: 92,
      clarity_delta: "+32%",
      politeness_score: 96,
      politeness_delta: "+50%",
      tone_warning_status: "Safe to Send 🟢",
    },
    before_after_highlights: [
      {
        original_red: "Hey prof / I'm freaking out / super overwhelmed",
        polished_green: `Dear ${recipientDisplay}, I am writing from [${refTag}] regarding ${situation.toLowerCase()}...`,
        reason:
          "Replaces informal opening panic with a dignified salutation and exact course/reference identifier.",
      },
      {
        original_red: cleanDraft.slice(0, 65),
        polished_green:
          "I want to take full responsibility for my coursework while sharing a brief update...",
        reason:
          "Reframes raw frustration or stress into accountable, solution-focused communication.",
      },
      {
        original_red: "can i turn it in later? sorry to bother you",
        polished_green:
          "Would you be open to granting a brief extension until Friday at 5:00 PM? Thank you for your time and consideration.",
        reason:
          "Proposes a concrete, low-friction deadline and swaps self-deprecation for warm gratitude.",
      },
    ],
    versions: {
      warm_respectful: polishedEmail,
      concise_direct: conciseDirect,
      simple_clear: simpleClear,
    },
    etiquette_lessons: [
      {
        principle:
          "3-Part Subject Line Formula ([Course Code] + Situation + Name)",
        before_snippet: "(No subject line or 'hey quick question')",
        after_snippet: subjectLines[0],
        why_it_works:
          "Professors get dozens of emails daily. Leading with [COMP 101] and your Course ID lets them filter and reply in seconds.",
        simple_kid_friendly_tip:
          "Think of the subject line like a clear label on your notebook so the teacher knows right away which class you are in!",
      },
      {
        principle: `Calibrated '${toneStyle}' Tone for ${platform}`,
        before_snippet: cleanDraft.slice(0, 75),
        after_snippet:
          "I encountered an unexpected challenge and want to make sure I meet your standards for the class.",
        why_it_works: `Matching the '${toneStyle}' tone on ${platform} removes emotional friction and makes the recipient want to help you succeed.`,
        simple_kid_friendly_tip:
          "When we explain our problem calmly and politely, teachers and helpers feel respected and ready to help.",
      },
      {
        principle: "Concrete Solution Over Open-Ended Burden",
        before_snippet: "What should I do now? / Can you help me?",
        after_snippet:
          "Would you be open to granting a brief extension until Friday at 5:00 PM, or could I stop by office hours?",
        why_it_works:
          "Giving a specific, reasonable date lets a busy professor reply with a two-word 'Yes, approved' instead of having to invent a plan for you.",
        simple_kid_friendly_tip:
          "Offer a fair, helpful plan so the other person can easily say 'Yes, that works!'",
      },
    ],
    tone_analysis: {
      overall_tone_summary: `Before refinement, your raw draft scored ${rawScore}% on Professionalism due to informal phrasing and missing course details. After calibrating for '${toneStyle}' on ${platform}, Clarity rose to 92% (+32%) and Politeness reached 96% (+50%).`,
      warmth_score: 91,
      clarity_score: 92,
      assertiveness_score: apologyStripper ? 93 : 87,
      respect_score: 96,
      flags: [
        {
          type: "Missing Course & Section Identifier",
          severity: "medium",
          flagged_phrase: "Message Header / Opening",
          issue_explanation:
            "Faculty teach multiple courses and hundreds of students; omitting your course code forces them to search their roster.",
          suggested_fix: `Use "${subjectLines[0]}" in the subject line and state your section in line 1.`,
        },
        {
          type: apologyStripper
            ? "Reflexive Over-Apologizing"
            : "Unbuffered Informal Urgency",
          severity: "low",
          flagged_phrase: cleanDraft.slice(0, 60),
          issue_explanation:
            "Ranting or apologizing excessively under stress can unintentionally obscure your actual constructive request.",
          suggested_fix:
            "State the situation concisely, take ownership, and propose a specific make-up date.",
        },
      ],
      missing_details_checklist: [
        `Confirm exact Course Code & Section (${refTag})`,
        `Verify recipient name (${recipientDisplay}) and your signature (${senderDisplay})`,
        "Attach doctor's note or supporting documentation if requesting an exam make-up",
      ],
      apology_audit: {
        unnecessary_apologies_found: cleanDraft.toLowerCase().includes("sorry")
          ? 2
          : 1,
        coaching_note:
          "Replaced self-undermining apologies ('sorry to bother you') with confident, respectful appreciation ('Thank you for your time and consideration').",
      },
    },
    professor_reactions: {
      likely_reply: `Hi ${senderDisplay}, thank you for letting me know ahead of time and proposing a clear timeline. Please go ahead and submit by Friday at 5:00 PM without penalty. Best, ${recipientDisplay}`,
      followup_question: `Hi ${senderDisplay}, thanks for reaching out. Could you please forward a brief note from the health clinic or advisor, and confirm which lab section you are registered in?`,
      worst_case_boundary: `Dear ${senderDisplay}, while I understand this week has been challenging, please consult the course syllabus regarding missed deadlines. Extensions require formal documentation through Student Services.`,
    },
    using_fallback: true,
  };
}

export interface RoboBuddyResponse {
  reply: string;
  word_meaning?: {
    word: string;
    simple_meaning: string;
    example_sentence: string;
  } | null;
  follow_up_suggestions: string[];
}

export const DIFFICULT_WORDS_DICTIONARY: Record<
  string,
  { simple_meaning: string; example_sentence: string }
> = {
  syllabus: {
    simple_meaning:
      "The class rulebook and schedule that your professor gives you on the first day of school.",
    example_sentence:
      "I checked the course syllabus to see how much the midterm exam is worth.",
  },
  rubric: {
    simple_meaning:
      "The grading checklist a teacher uses to score your essay, project, or test.",
    example_sentence:
      "According to the grading rubric, we get 20 points for clear citations.",
  },
  extension: {
    simple_meaning:
      "Extra time to finish and turn in your homework or project without losing points.",
    example_sentence:
      "Because I had the flu, I politely asked my professor for a 48-hour extension.",
  },
  "office hours": {
    simple_meaning:
      "Special times each week when your professor sits in their office waiting to help students one-on-one.",
    example_sentence:
      "Could I visit your office hours on Tuesday at 2 PM to go over my essay?",
  },
  salutation: {
    simple_meaning:
      "The polite greeting at the very start of an email, like 'Dear Professor Smith,'.",
    example_sentence:
      "Starting with a warm salutation sets a respectful tone right away.",
  },
  deductible: {
    simple_meaning:
      "The amount of money you have to pay yourself for medical care before your insurance starts paying.",
    example_sentence:
      "My insurance bill says $200 goes toward my yearly deductible.",
  },
  "extenuating circumstances": {
    simple_meaning:
      "Unusual, unexpected life events outside your control (like an illness or car breakdown) that make it hard to finish on time.",
    example_sentence:
      "Due to extenuating circumstances this week, I am requesting a short extension.",
  },
  "passive-aggressive": {
    simple_meaning:
      "Sounding polite on the surface while actually sneaking in frustration, blame, or sarcasm.",
    example_sentence:
      "Saying 'As I already told you' can sound passive-aggressive, so say 'Just to clarify' instead.",
  },
  "teaching assistant": {
    simple_meaning:
      "An older student (often called a TA) who helps the professor grade papers, run labs, and answer questions.",
    example_sentence:
      "I emailed my Teaching Assistant to ask about the biology lab worksheet.",
  },
  prerequisite: {
    simple_meaning:
      "A beginner class you must pass first before you are allowed to take a harder class.",
    example_sentence:
      "Intro to Biology is a prerequisite for Advanced Genetics.",
  },
};

export function buildRoboBuddyFallback(
  userQuestion: string,
  currentDraft: string = "",
  currentPolished: string = ""
): RoboBuddyResponse {
  const q = (userQuestion || "").trim();
  const lower = q.toLowerCase();

  // Check if the user is asking about any known difficult word in our dictionary
  for (const [term, info] of Object.entries(DIFFICULT_WORDS_DICTIONARY)) {
    if (lower.includes(term)) {
      return {
        reply: `Beep-boop! 💡 **"${term.toUpperCase()}"** is a very common word in emails, and it's super easy once you know it!\n\n**Simple Meaning:** ${info.simple_meaning}\n\n**How to use it:** *"${info.example_sentence}"*`,
        word_meaning: {
          word: term,
          simple_meaning: info.simple_meaning,
          example_sentence: info.example_sentence,
        },
        follow_up_suggestions: [
          "What does 'Rubric' mean?",
          "What are 'Office Hours'?",
          "Is my email polite enough to send?",
        ],
      };
    }
  }

  // Check if user is asking to explain words in their current polished email
  if (
    lower.includes("difficult word") ||
    lower.includes("hard word") ||
    lower.includes("meaning") ||
    lower.includes("define") ||
    lower.includes("explain words")
  ) {
    return {
      reply:
        "Beep-boop! 🤖 Here are 3 big words you might see in your polished email, explained super simply:\n\n" +
        "1. **Syllabus**: The class rulebook and calendar your teacher hands out on Day 1.\n" +
        "2. **Consideration**: Taking the time to kindly think about your request.\n" +
        "3. **Extension**: Extra days to finish your work without getting penalized.\n\n" +
        "Type any specific word you're curious about, and I'll break it down for you!",
      word_meaning: {
        word: "Consideration",
        simple_meaning:
          "Kindly thinking about someone's situation and request before making a decision.",
        example_sentence:
          "Thank you very much for your time and consideration.",
      },
      follow_up_suggestions: [
        "What does 'Extenuating Circumstances' mean?",
        "What does 'Deductible' mean on a medical bill?",
        "How should I start an email to a strict professor?",
      ],
    };
  }

  // Check if user is asking how to use the website or if their email is ready
  if (
    lower.includes("how") ||
    lower.includes("doubt") ||
    lower.includes("polite") ||
    lower.includes("send")
  ) {
    return {
      reply:
        "Beep-boop! 🌟 Your polished message looks warm, respectful, and clear! Here is a quick 3-step check before you send it:\n\n" +
        "• **Step 1:** Make sure you replaced any bracketed words like `[Your Full Name]` or `[Last Name]`.\n" +
        "• **Step 2:** Copy one of the 3 **Subject Lines** so the recipient knows who you are right away.\n" +
        "• **Step 3:** Send it during normal daytime hours if you can—and don't stress, professors appreciate proactive communication!",
      word_meaning: null,
      follow_up_suggestions: [
        "Explain difficult words in my email",
        "What does 'Syllabus' mean?",
        "What if the professor says no?",
      ],
    };
  }

  return {
    reply:
      `Beep-boop! 🤖 I'm **Bibo**, your friendly communication & vocabulary buddy! Regarding *"${q.slice(
        0,
        60
      )}"*:\n\n` +
      `In plain English, the best rule is to be **kind, clear, and specific**. Tell the other person who you are in the first sentence, explain what happened in 1–2 calm sentences without blaming yourself or them, and suggest one fair next step!\n\n` +
      `Ask me the meaning of any tricky word (like *Syllabus*, *Rubric*, *Deductible*, or *Extenuating Circumstances*) anytime!`,
    word_meaning: null,
    follow_up_suggestions: [
      "Explain difficult words in my email",
      "What does 'Rubric' mean?",
      "What are 'Office Hours'?",
    ],
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
  "dean of students": {
    simpleMeaning:
      "A helpful college office that supports students when they have big health, family, or personal emergencies.",
    exampleUse:
      "\"I can also provide verification through the Dean of Students office.\"",
    kidAndSeniorTip:
      "If you are in the hospital or have a major emergency, they can email all your professors for you!",
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

  // Check if the user is asking about any word in our glossary
  for (const [term, info] of Object.entries(SIMPLE_WORD_GLOSSARY)) {
    if (lower.includes(term)) {
      return {
        reply: `Beep-boop! 🤖 Let me explain **"${term}"** in super simple words:\n\n• **What it means:** ${info.simpleMeaning}\n• **How to use it:** ${info.exampleUse}\n• **Friendly Tip:** ${info.kidAndSeniorTip}`,
        wordBreakdown: {
          word: term,
          ...info,
        },
        suggestedFollowups: [
          "What does 'office hours' mean?",
          "What does 'rubric' mean?",
          "Should I say 'sorry' in my email?",
        ],
      };
    }
  }

  if (lower.includes("mean") || lower.includes("define") || lower.includes("word")) {
    return {
      reply:
        "Beep-boop! 🤖 I love explaining tricky words in plain English! Whenever someone uses a big academic or medical word, it just means they want to sound formal—you can always ask me any specific word (like *syllabus*, *rubric*, *extension*, *office hours*, or *deductible*) and I will break it down simply for you!",
      suggestedFollowups: [
        "What does 'syllabus' mean?",
        "What does 'rubric' mean?",
        "What does 'extension' mean?",
      ],
    };
  }

  if (lower.includes("sorry") || lower.includes("apolog")) {
    return {
      reply:
        "Great question! 🤖 You only need to say **'I apologize'** if you accidentally broke a promise or missed a meeting without warning. If you are just asking a question, asking for help, or sick, swap *'Sorry to bother you'* for **'Thank you so much for your time and help!'** It sounds warm and confident!",
      suggestedFollowups: [
        "How do I ask for an extension politely?",
        "What if my professor says no?",
        "What does 'syllabus' mean?",
      ],
    };
  }

  if (lower.includes("no") || lower.includes("reject") || lower.includes("mad") || lower.includes("angry")) {
    return {
      reply:
        "Don't worry! 🤖 Most professors, teachers, and doctors aren't mad at you—they are just super busy! Even if they say *'No'* to an extension, you can politely reply: **'Thank you for letting me know, Professor. I will turn in what I have completed so far and visit office hours next week to stay on track.'**",
      suggestedFollowups: [
        "What does 'office hours' mean?",
        "How do I ask about a low grade?",
        "Should I use Email or WhatsApp?",
      ],
    };
  }

  return {
    reply:
      "Hi friend! I'm **Bibo**, your friendly communication buddy! 🤖✨\n\nI can help you:\n1. **Explain any difficult or confusing word** in plain, everyday language.\n2. **Clear up doubts** about how to talk to professors, doctors, teachers, or bosses.\n3. **Tell you if your message sounds polite and clear.**\n\nJust type any word or question below, or tap one of the quick buttons!",
    suggestedFollowups: [
      "What does 'syllabus' mean?",
      "What does 'rubric' mean?",
      "Should I say 'sorry' in my email?",
      "What if my professor is strict?",
    ],
  };
}

