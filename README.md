# 🚀 [Project Title / Say It Right]

> [Short, catchy 1-2 sentence tagline describing what your app does and who it helps.]

---

## 🎯 Overview & Chosen Vertical
* **Vertical / Category:** [e.g., EdTech / Accessibility & Inclusion / Universal Communication]
* **Target Audience:** [e.g., College Students, School Kids, Seniors & Elders, Personal Relationships]
* **Core Problem Solved:** [e.g., Communication anxiety, over-explaining, and tone misinterpretation across diverse age groups.]

---

## ✨ Key Features

* 🎓 **Adaptive Persona Modes:** Custom coaching for academic emails, senior medical inquiries, and kids' clubhouse interactions.
* 💖 **Vibe Check & Overthinking Shield:** Flags texting traps like passive-aggression or reply pressure before sending.
* 🤖 **Bibo Robo AI Assistant:** Interactive chatbot for clearing doubts, explaining hard vocabulary, and voice read-aloud playback.
* 📊 **Gamified Etiquette Scoring:** Live politeness and clarity meters with 1-click A4 PDF export options.
* ⌨️ **Accessibility & Shortcuts:** Dark mode toggle, WCAG high-contrast themes, and global keyboard shortcut controls.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend / Framework:** Python, Streamlit, HTML5/CSS3
* **AI & LLM Engine:** Google Gemini API (`google-genai` SDK)
* **Document Export:** `reportlab` / `fpdf2`
* **Audio & Speech:** Web Audio API & SpeechSynthesis API

---

## 🧠 Approach, Logic & Architecture

1. **Input & Persona Calibration:** Captures user context, mood/emotion selection, and recipient dynamics.
2. **AI Processing & Prompt Guardrails:** Passes structured inputs to the Gemini API with strict formatting rules.
3. **Resilient Fallback Design:** All API and JSON parsing functions are wrapped in robust `try-catch` blocks with built-in offline dictionaries to ensure zero runtime crashes.
4. **Insights & Export Formatting:** Generates side-by-side before/after comparisons, scorecards, and formatted downloadable PDFs.

---

## ⚙️ How to Install and Run Locally

### Prerequisites
* Python 3.9+ installed
* A valid Google Gemini API Key

### Quick Start Commands

```bash
# 1. Clone the repository
git clone [https://github.com/](https://github.com/)[your-username]/[your-repo-name].git
cd [your-repo-name]

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your API key
# On Linux/macOS:
export GEMINI_API_KEY="your_actual_gemini_api_key"
# On Windows (Command Prompt):
set GEMINI_API_KEY="your_actual_gemini_api_key"

# 4. Run the application
streamlit run app.py
