# 🚀 Say It Right: Universal & Student Email Coach

---

## 🎯 Overview & Chosen Vertical
* **Vertical / Category:** EdTech / Accessibility & Inclusion / Universal Communication
* **Target Audience:** College Students, School Kids & Teens, Seniors & Elders, Women & Self-Advocacy, and Everyday Personal Relationships
* **Core Problem Solved:** Eliminates communication anxiety, over-explaining, and tone misinterpretation across diverse age groups and high-stakes situations.

---

## ✨ Key Features

* 🎓 **Adaptive Persona Modes:** Custom coaching for college academic emails, senior medical/bank inquiries, cartoon kids' clubhouse interactions, self-advocacy, and friendly personal chats.
* 💖 **Vibe Check & Overthinking Shield:** Flags texting traps like passive-aggression, clinginess/over-explaining, or high reply pressure before sending, plus a **Cool-Off Delay Prompt** for heated moments.
* 🌏 **Hinglish / Tanglish / Spanglish Slang Adapter:** Natural Romanized chat script support with auto-language detection and subtle warm emoji placement.
* 🤖 **Bibo Robo AI Assistant:** Interactive robot helper for clearing doubts, explaining hard vocabulary in plain words, and voice read-aloud playback.
* 📊 **Gamified Etiquette Scoring & Crisis Starters:** Live Politeness and Clarity score meters, achievement badges, interactive Before & After phrase highlighting with tooltips, recipient reaction simulator, and 1-click A4 PDF export.
* ⌨️ **Accessibility & Power Shortcuts:** Dark mode toggle (`Alt+D`), WCAG high-contrast themes, Read Aloud TTS (`Alt+R`), and global keyboard shortcuts (`Ctrl+Enter` to generate, `Ctrl+S` to save draft, `Ctrl+Shift+E` to export PDF).

---

## 🛠️ Tech Stack & Dependencies

* **Frontend Framework:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
* **Backend Server:** Node.js, Express, Vite Middleware (`tsx server.ts`)
* **AI & LLM Engine:** Google Gemini API (`@google/genai` SDK — `gemini-3.8-flash` & `gemini-3.8-flash-lite-tts`)
* **Document Export:** `jspdf` (Formatted A4 PDF generation)
* **Audio & Speech:** Web Audio API, Gemini TTS (WAV synthesis), & Browser SpeechSynthesis API

---

## 🧠 Approach, Logic & Architecture

1. **Input & Persona Calibration:** Captures user context, mood/emotion selection, output text format (6 layouts), and recipient dynamics.
2. **AI Processing & Prompt Guardrails:** Passes structured inputs to the server-side Gemini API with strict JSON schema validation.
3. **Resilient Fallback Design:** All API and JSON parsing endpoints are wrapped in robust `try-catch` and timeout blocks with built-in offline dictionaries to guarantee zero runtime crashes.
4. **Insights & Export Formatting:** Generates side-by-side before/after comparisons, scorecards, recipient reaction forecasts, pre-send safety checklists, and downloadable A4 PDFs.

---

## ⚙️ How to Install and Run Locally

### Prerequisites
* Node.js 18+ installed
* A valid Google Gemini API Key

### Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key
# On Linux/macOS:
export GEMINI_API_KEY="your_actual_gemini_api_key"
# On Windows (Command Prompt):
set GEMINI_API_KEY="your_actual_gemini_api_key"

# 3. Start the full-stack development server (Port 3000)
npm run dev

# 4. Verify TypeScript types & production build
npm run lint
npm run build
```

