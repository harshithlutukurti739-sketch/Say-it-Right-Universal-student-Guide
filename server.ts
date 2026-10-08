import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import {
  buildFallbackResponse,
  buildRoboFallbackReply,
} from "./src/fallbackData.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

/**
 * Safely parses JSON from Gemini output, stripping markdown code fences if present.
 * Returns null if parsing fails so the caller can gracefully return fallback data.
 */
function safeParseJson<T = any>(rawText: string | undefined | null): T | null {
  if (!rawText || typeof rawText !== "string") return null;
  try {
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (_err) {
    return null;
  }
}

// Main API endpoint to analyze text OR multimodal voice note ("Rant-to-Email")
app.post("/api/analyze-email", async (req, res) => {
  const {
    roughDraft = "",
    persona = "college_student",
    personaLabel = "First-Year College Student (Core Niche)",
    relationship = "Strict / Formal Professor",
    situation = "Extension Request",
    toneStyle = "Polite & Direct",
    platform = "Email",
    apologyStripper = true,
    simplifyLanguage = false,
    targetLanguage = "English",
    courseOrRefCode = "COMP 101 - Course ID #1042",
    studentName = "",
    professorName = "",
    audioBase64 = "",
    audioMimeType = "audio/webm",
  } = req.body || {};

  const fallbackPayload = buildFallbackResponse({
    roughDraft,
    persona,
    relationship,
    situation,
    toneStyle,
    platform,
    apologyStripper,
    simplifyLanguage,
    targetLanguage,
    courseOrRefCode,
    studentName,
    professorName,
  });

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(200).json(fallbackPayload);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are "Say It Right: Student-to-Professor & Universal Email Coach", an empathetic, world-class communication coach.
If an audio clip is provided, first transcribe the user's spoken voice note ("Rant-to-Email") into \`transcribed_text\`, and then refine it into a polished message.

CONFIGURATION:
- User Persona Mode: ${personaLabel} (${persona})
- Recipient / Relationship: ${relationship}
- Recipient Name (if provided): ${professorName || "Use appropriate placeholder like Professor [Last Name]"}
- Sender Name (if provided): ${studentName || "Use appropriate placeholder like [Your Full Name]"}
- Situation Type: ${situation}
- Selected Tone Option: "${toneStyle}" (Options: Ultra Formal, Polite & Direct, Apologetic, Persuasive — strictly calibrate the message to match "${toneStyle}"!)
- Target Communication Platform: "${platform}" (Options: Email, WhatsApp / Text Message, Slack / Discord. If WhatsApp/Text or Slack/Discord is chosen, make it shorter, punchier, and channel-appropriate without stiff formal email headers while keeping respectful boundaries!)
- Course Code / Reference ID: ${courseOrRefCode || "COMP 101 - Course ID #1042"}
- Apology-Stripper Booster: ${apologyStripper ? "ACTIVE (Replace unnecessary 'sorry to bother you' with warm gratitude)" : "Standard"}
- Plain-Language Booster (Kids/Seniors): ${simplifyLanguage ? "ACTIVE (Simple, clear vocabulary)" : "Standard"}
- Output Language: ${targetLanguage}

USER'S ROUGH TEXT DRAFT (if any):
"""
${roughDraft}
"""

Generate a complete JSON response containing:
1. \`transcribed_text\`: If audio was provided, the exact transcription of what the user said; otherwise echo their rough draft.
2. \`subject_line\`: The single best subject line.
3. \`subject_lines\`: Exactly 3 catchy, professional subject lines tailored to the situation and course code (e.g., "[COMP 101] Extension Request - Course ID #1042").
4. \`polished_email\`: The final polished message matching "${toneStyle}" and formatted for "${platform}" in ${targetLanguage}.
5. \`readiness_scorecard\`:
   - \`raw_professionalism_score\`: 0-100 integer measuring how professional vs casual/demanding the original draft was BEFORE refinement.
   - \`raw_professionalism_label\`: Short diagnostic label for the raw draft.
   - \`clarity_score\`: 0-100 integer after polishing.
   - \`clarity_delta\`: Improvement string like "+30%".
   - \`politeness_score\`: 0-100 integer after polishing.
   - \`politeness_delta\`: Improvement string like "+50%".
   - \`tone_warning_status\`: "Safe to Send 🟢".
6. \`before_after_highlights\`: Array of 3 specific phrase transformations showing \`original_red\` (informal/risky phrase from raw draft), \`polished_green\` (upgraded phrase in polished version), and \`reason\`.
7. \`versions\`: 3 alternative versions (\`warm_respectful\`, \`concise_direct\`, \`simple_clear\`).
8. \`etiquette_lessons\`: 3 etiquette lessons (\`principle\`, \`before_snippet\`, \`after_snippet\`, \`why_it_works\`, \`simple_kid_friendly_tip\`).
9. \`tone_analysis\`: \`overall_tone_summary\`, \`warmth_score\`, \`clarity_score\`, \`assertiveness_score\`, \`respect_score\`, \`flags\`, \`missing_details_checklist\`, and \`apology_audit\`.
10. \`professor_reactions\`: 3 simulated recipient responses:
   - \`likely_reply\` (🟢 Likely Reply)
   - \`followup_question\` (🟡 Follow-up Question)
   - \`worst_case_boundary\` (🔴 Worst-Case Scenario / Boundary)`;

    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: audioMimeType || "audio/webm",
          data: audioBase64,
        },
      });
    }
    parts.push({ text: prompt });

    // Wrap Gemini call with an 11-second timeout guard so slow requests never hang or fail
    const geminiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcribed_text: { type: Type.STRING },
            subject_line: { type: Type.STRING },
            subject_lines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            polished_email: { type: Type.STRING },
            readiness_scorecard: {
              type: Type.OBJECT,
              properties: {
                raw_professionalism_score: { type: Type.INTEGER },
                raw_professionalism_label: { type: Type.STRING },
                clarity_score: { type: Type.INTEGER },
                clarity_delta: { type: Type.STRING },
                politeness_score: { type: Type.INTEGER },
                politeness_delta: { type: Type.STRING },
                tone_warning_status: { type: Type.STRING },
              },
              required: [
                "raw_professionalism_score",
                "raw_professionalism_label",
                "clarity_score",
                "clarity_delta",
                "politeness_score",
                "politeness_delta",
                "tone_warning_status",
              ],
            },
            before_after_highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original_red: { type: Type.STRING },
                  polished_green: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["original_red", "polished_green", "reason"],
              },
            },
            versions: {
              type: Type.OBJECT,
              properties: {
                warm_respectful: { type: Type.STRING },
                concise_direct: { type: Type.STRING },
                simple_clear: { type: Type.STRING },
              },
              required: ["warm_respectful", "concise_direct", "simple_clear"],
            },
            etiquette_lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  principle: { type: Type.STRING },
                  before_snippet: { type: Type.STRING },
                  after_snippet: { type: Type.STRING },
                  why_it_works: { type: Type.STRING },
                  simple_kid_friendly_tip: { type: Type.STRING },
                },
                required: [
                  "principle",
                  "before_snippet",
                  "after_snippet",
                  "why_it_works",
                  "simple_kid_friendly_tip",
                ],
              },
            },
            tone_analysis: {
              type: Type.OBJECT,
              properties: {
                overall_tone_summary: { type: Type.STRING },
                warmth_score: { type: Type.INTEGER },
                clarity_score: { type: Type.INTEGER },
                assertiveness_score: { type: Type.INTEGER },
                respect_score: { type: Type.INTEGER },
                flags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      flagged_phrase: { type: Type.STRING },
                      issue_explanation: { type: Type.STRING },
                      suggested_fix: { type: Type.STRING },
                    },
                    required: [
                      "type",
                      "severity",
                      "flagged_phrase",
                      "issue_explanation",
                      "suggested_fix",
                    ],
                  },
                },
                missing_details_checklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                apology_audit: {
                  type: Type.OBJECT,
                  properties: {
                    unnecessary_apologies_found: { type: Type.INTEGER },
                    coaching_note: { type: Type.STRING },
                  },
                  required: ["unnecessary_apologies_found", "coaching_note"],
                },
              },
              required: [
                "overall_tone_summary",
                "warmth_score",
                "clarity_score",
                "assertiveness_score",
                "respect_score",
                "flags",
                "missing_details_checklist",
                "apology_audit",
              ],
            },
            professor_reactions: {
              type: Type.OBJECT,
              properties: {
                likely_reply: { type: Type.STRING },
                followup_question: { type: Type.STRING },
                worst_case_boundary: { type: Type.STRING },
              },
              required: [
                "likely_reply",
                "followup_question",
                "worst_case_boundary",
              ],
            },
          },
          required: [
            "transcribed_text",
            "subject_line",
            "subject_lines",
            "polished_email",
            "readiness_scorecard",
            "before_after_highlights",
            "versions",
            "etiquette_lessons",
            "tone_analysis",
            "professor_reactions",
          ],
        },
      },
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 11000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    if (!response || !response.text) {
      return res.status(200).json(fallbackPayload);
    }

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.polished_email) {
      return res.status(200).json(fallbackPayload);
    }

    return res.status(200).json({
      ...fallbackPayload,
      ...parsed,
      platform_used: platform,
      tone_used: toneStyle,
      using_fallback: false,
    });
  } catch (_error) {
    return res.status(200).json(fallbackPayload);
  }
});

// Dedicated endpoint for the "🧪 Predict Professor's Reaction" button
app.post("/api/simulate-reaction", async (req, res) => {
  const {
    polishedEmail = "",
    relationship = "Strict / Formal Professor",
    situation = "Extension Request",
  } = req.body || {};

  const fallbackReactions = {
    likely_reply:
      "Sure, thank you for letting me know ahead of time and proposing a clear plan. You may submit by Friday at midnight without penalty.",
    followup_question:
      "Thanks for reaching out. Please provide a doctor's note or official documentation and confirm which class section you attend.",
    worst_case_boundary:
      "Please consult the syllabus regarding missed deadlines. Extensions require prior documentation verified through Student Services.",
  };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(200).json(fallbackReactions);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Analyze this message sent to a "${relationship}" regarding "${situation}":\n"""\n${polishedEmail}\n"""\nPredict 3 realistic outcomes:\n1. likely_reply (🟢 Likely Reply)\n2. followup_question (🟡 Follow-up Question)\n3. worst_case_boundary (🔴 Worst-Case Scenario / Boundary)`,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likely_reply: { type: Type.STRING },
            followup_question: { type: Type.STRING },
            worst_case_boundary: { type: Type.STRING },
          },
          required: ["likely_reply", "followup_question", "worst_case_boundary"],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.likely_reply) {
      return res.status(200).json(fallbackReactions);
    }
    return res.status(200).json(parsed);
  } catch (_err) {
    return res.status(200).json(fallbackReactions);
  }
});

// Dedicated Gemini TTS endpoint using `gemini-3.8-flash-lite-tts`
app.post("/api/tts", async (req, res) => {
  const { text = "", persona = "college_student" } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !text.trim()) {
    return res.status(200).json({ audioBase64: null });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const styleInstruction =
      persona === "seniors"
        ? "Warm, patient, clear, and unhurried voice"
        : persona === "school_kids"
        ? "Friendly, encouraging, kind teacher voice"
        : "Clear, calm, articulate professional coach";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.slice(0, 1200),
              speechMetadata: {
                style: styleInstruction,
              },
            } as any,
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    return res.status(200).json({ audioBase64: base64Audio });
  } catch (_err) {
    return res.status(200).json({ audioBase64: null });
  }
});

// Dedicated endpoint for the Cute Robo Figure Chatbot ("Bibo") to clear doubts and explain difficult words simply
app.post("/api/robo-chat", async (req, res) => {
  const {
    userMessage = "",
    persona = "college_student",
    currentDraft = "",
    polishedEmail = "",
  } = req.body || {};

  const fallbackReply = buildRoboFallbackReply(userMessage);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !userMessage.trim()) {
    return res.status(200).json(fallbackReply);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are "Bibo" 🤖, a super cute, warm, encouraging mini-robot assistant inside the "Say It Right" email coach website.
Your job is to:
1. Explain the meaning of any difficult academic, medical, financial, or professional words in super simple, everyday language that a 10-year-old kid, a first-year student, or a senior citizen can immediately understand.
2. Clear up any doubts the user has about emailing a professor, teacher, doctor, or supervisor.
3. Keep answers friendly, short (2-4 short bullet points or sentences), and reassuring!

USER CONTEXT:
- Mode: ${persona}
- Current Rough Draft: "${currentDraft.slice(0, 300)}"
- Current Polished Message: "${polishedEmail.slice(0, 300)}"

USER QUESTION / WORD TO EXPLAIN:
"${userMessage}"

Return a JSON object with:
- \`reply\`: Friendly, super-easy-to-understand explanation from Bibo the robot.
- \`wordBreakdown\` (optional object if they asked about a word or phrase, otherwise can be omitted): \`word\`, \`simpleMeaning\`, \`exampleUse\`, \`kidAndSeniorTip\`.
- \`suggestedFollowups\`: Array of 3 short follow-up questions the user can click next.`;

    const geminiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            wordBreakdown: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                simpleMeaning: { type: Type.STRING },
                exampleUse: { type: Type.STRING },
                kidAndSeniorTip: { type: Type.STRING },
              },
            },
            suggestedFollowups: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["reply", "suggestedFollowups"],
        },
      },
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 9000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    if (!response || !response.text) {
      return res.status(200).json(fallbackReply);
    }

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.reply) {
      return res.status(200).json(fallbackReply);
    }
    return res.status(200).json({ ...fallbackReply, ...parsed });
  } catch (_err) {
    return res.status(200).json(fallbackReply);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
