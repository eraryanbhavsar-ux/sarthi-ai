# SARTHI — Understand. Hear. Translate. Act.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)
[![WCAG Conformance](https://img.shields.io/badge/WCAG-2.1%20AA%2FAAA-emerald.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **Theme:** AI for Accessibility & Inclusion  
> **Product Name:** SARTHI  
> **Tagline:** Understand. Hear. Translate. Act.  
> **Core Promise:** SARTHI transforms difficult, intimidating digital information into accessible, plain-language, voice-guided, multilingual, and actionable workflows for people with diverse abilities and needs.

---

## 1. Problem Statement

Every day, millions of individuals receive complicated government notifications, hospital discharge instructions, scholarship guidelines, legal notices, and bank alerts.

They frequently struggle because:
- Language is dense, bureaucratic, and packed with confusing jargon.
- Text is visually overwhelming without clear hierarchy or visual pacing.
- Critical deadlines and mandatory documents are buried deep in multi-page circulars.
- Content is provided only in English rather than regional or mother-tongue languages.
- Individuals with cognitive fatigue, dyslexia, or visual/hearing limitations face digital exclusion.
- Traditional chatbots merely summarize text in paragraphs without providing an **actionable, step-by-step path forward**.

**The fundamental barrier is not the user's disability — it is that digital information is not designed for diverse human needs.**

---

## 2. The Solution: SARTHI

**SARTHI** is an adaptive AI accessibility layer. Rather than operating as another generic chatbot, SARTHI converts dense digital materials into an empowering, independent action plan.

### Key Differentiators: "WHAT DO I NEED TO DO?"
When a user uploads a PDF, image, or pasted text, SARTHI automatically extracts and organizes:
1. **What is this?** — Plain language executive overview.
2. **What matters?** — Key eligibility rules and essential takeaways.
3. **What do I need?** — Mandatory documents and certificates required.
4. **What do I need to do?** — An interactive action checklist with progress tracking.
5. **What happens next?** — Step-by-step guidance showing one focused card at a time.
6. **Are there deadlines?** — Urgency-ranked cutoffs and submission dates.
7. **What is missing?** — Critical details the document failed to mention.
8. **Can I hear this?** — Built-in text-to-speech audio narration with speed controls.
9. **Can I translate this?** — High-fidelity regional translations (Marathi, Hindi, Gujarati, Tamil, etc.).
10. **Can I ask questions?** — Contextual Q&A strictly grounded in the document with zero hallucination.

---

## 3. Tech Stack

- **Frontend:**
  - React.js (v18)
  - Vite (v5)
  - React Router DOM (v6)
  - Tailwind CSS with custom WCAG accessibility theme classes
  - Axios (with automated JWT Bearer authorization interceptors)
  - Lucide React icons
  - Web Speech API (SpeechSynthesis & SpeechRecognition)
- **Backend:**
  - Node.js (v22) & Express.js
  - JWT (JSON Web Tokens) authentication
  - `bcryptjs` password hashing (10 salt rounds)
  - Zod schema validation (request sanitization & AI output verification)
  - Multer memory storage (safe file upload handling)
  - `pdf-parse` (fast text extraction from PDF documents)
  - Helmet & CORS security middleware
  - Express Rate Limit (DDoS & brute-force mitigation)
- **Database:**
  - MongoDB Atlas (via Mongoose)
  - Seamless in-memory fallback store ensuring zero-crash offline and local evaluations.
- **AI Engine:**
  - Google Gemini API (`gemini-3.8-flash` / `@google/genai` SDK)
  - Multimodal vision and OCR for image screenshots and forms
  - Structured output schemas with strict Zod validation
  - Grounded question-answering prompts enforcing factual grounding.

---

## 4. Accessibility-First Architecture

Accessibility is not an optional settings screen in SARTHI — the entire platform embodies WCAG 2.1 AA/AAA principles:

- **Universal Accessibility Toolbar:** A persistent floating dock enabling instant toggling of:
  - **Text Sizing:** Standard (100%), Large (115%), X-Large (130%).
  - **Contrast Themes:** Default, Dark Amber on Deep Black, High Light monochrome.
  - **Dyslexia Reading Mode:** Expanded letter-spacing, line-height 1.85, and word spacing.
  - **Reduced Motion:** Disables all transitions and pulsing animations for vestibular comfort.
  - **Simplified Interface:** Removes decorative cards and secondary visual elements.
  - **Voice Narration:** Automated screen reader alerts and speech synthesis.
- **Keyboard Operability:** 100% navigable via `Tab`, `Shift+Tab`, `Enter`, and `Space`.
- **Visible Focus:** 3px high-visibility amber outline (`:focus-visible`) across all interactive controls.
- **Skip Link:** "Skip to main content" link accessible immediately upon first Tab press.
- **Screen Reader Live Regions:** Hidden `aria-live="polite"` elements announcing real-time state changes.

---

## 5. Project Structure

```
sarthi ai/
├── ARCHITECTURE.md              # System architecture & Mermaid diagrams
├── JUDGE_FEATURE_MAP.md         # Challenge requirement verification rubric
├── DEMO_SCRIPT.md               # 3 to 5 minute hackathon presentation script
├── README.md                    # This comprehensive guide
├── vercel.json                  # Frontend Vercel deployment configuration
├── render.yaml                  # Backend Render deployment configuration
├── package.json                 # Root project scripts
├── .env.example                 # Root environment variables guide
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js            # Express entry point & middleware stack
│   │   ├── config/              # env.js and db.js (MongoDB Atlas & Fallback)
│   │   ├── controllers/         # authController, accessibilityController, sessionController
│   │   ├── middleware/          # auth, validate, upload, rateLimiter, errorHandler
│   │   ├── models/              # User, Session, memoryStore, userRepo, sessionRepo
│   │   ├── routes/              # authRoutes, accessibilityRoutes, sessionRoutes
│   │   ├── services/ai/         # geminiService, prompts, schemas
│   │   ├── utils/               # pdfExtractor, sampleDocument
│   │   └── validators/          # authSchemas, accessibilitySchemas, aiOutputSchema
│   └── tests/                   # validator and AI service unit tests
│
└── frontend/
    ├── package.json
    ├── vite.config.js           # Vite config with API proxy
    ├── tailwind.config.js       # Custom accessibility theme extensions
    ├── index.html               # Semantic HTML5 entry with Inter font
    └── src/
        ├── main.jsx             # React DOM root
        ├── App.jsx              # Main routing and global layout
        ├── index.css            # Tailwind directives + WCAG accessibility classes
        ├── components/          # Navbar, Footer, AccessibilityToolbar, ActionChecklist,
        │                        # StepByStepCard, SimplerModeView, TranslationTab,
        │                        # GroundedQnA, DocumentViewer, AudioPlayerDock, SkipLink
        ├── context/             # AuthContext, AccessibilityContext
        ├── pages/               # LandingPage, WorkspacePage, DashboardPage, LoginPage, RegisterPage
        └── services/            # api.js (Axios client), accessibilityService.js
```

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js v18 or higher (v22 recommended)
- npm v9 or higher
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/aryanbhavsar/sarthi-ai.git
cd sarthi-ai
```

### Step 2: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```
*(Or install individually: `cd backend && npm install`, then `cd ../frontend && npm install`)*

### Step 3: Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sarthi?retryWrites=true&w=majority
JWT_SECRET=sarthi_super_secure_jwt_secret_hackathon_2026_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```
> *Note: If `MONGODB_URI` is left blank, SARTHI automatically enables its built-in in-memory repository store, ensuring zero-crash evaluation.*

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Running the Application Locally

Run the backend and frontend in two terminal windows:

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Active on http://localhost:5000 (Health Check: http://localhost:5000/api/health)
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Active on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 8. Running Automated Tests

SARTHI includes unit tests covering authentication validation, document payload validation, AI schema verification, and grounded answering fallbacks.

```bash
cd backend
npm test
```

---

## 9. API Documentation

### Authentication Endpoints
- `POST /api/auth/register` — Create a new account with preferred language.
- `POST /api/auth/login` — Sign in and receive signed JWT token.
- `POST /api/auth/demo-login` — Instant one-click login for evaluators.
- `GET /api/auth/me` — Retrieve current user profile and analytics.
- `PUT /api/auth/preferences` — Update accessibility preferences.

### Accessibility Endpoints
- `POST /api/accessibility/analyze` — Analyze PDF, image (PNG/JPG/WebP), or pasted text.
- `POST /api/accessibility/question` — Contextual Q&A strictly grounded in the document.
### Accessibility Endpoints
- `POST /api/accessibility/analyze` — Analyze PDF, image (PNG/JPG/WebP), or pasted text.
- `POST /api/accessibility/question` — Contextual Q&A strictly grounded in the document.
- `POST /api/accessibility/translate` — Complete document translation into 11 Indian regional languages.
- `POST /api/accessibility/simplify` — "Make it even simpler" plain-language distillation.
- `GET /api/accessibility/sample` — Load verified scholarship guidelines sample.
- `POST /api/accessibility/voice` — Process voice transcripts and commands with regional language routing.
- `GET /api/accessibility/tts/status` — Check backend Cloud TTS configuration status.
- `POST /api/accessibility/tts` — Server-side text-to-speech synthesis endpoint for regional speech.

### Vision Endpoints (SARTHI Vision)
- `POST /api/vision/analyze` — Multimodal camera and image analysis for visual accessibility.
- `POST /api/vision/question` — Ask contextual visual questions ("What am I looking at?", "What do I need to do?").
- `POST /api/vision/form-guide` — Step-by-step form field guidance with plain-language tips.
- `GET /api/vision/sample` — Pre-verified vision analysis sample for instant demonstration.
- `GET /api/vision/sessions` — List user's vision scans and camera sessions.
- `GET /api/vision/sessions/:id` — Retrieve a specific vision session (with user authorization isolation).
- `DELETE /api/vision/sessions/:id` — Delete a vision session.

### Session Endpoints
- `GET /api/sessions` — List user's saved accessibility sessions.
- `GET /api/sessions/stats` — Real user analytics (documents, actions, questions).
- `GET /api/sessions/:id` — Retrieve a specific session (with strict cross-user access controls).
- `PATCH /api/sessions/:id/checklist` — Update completed state of an action item.
- `DELETE /api/sessions/:id` — Delete a session.

---

## 10. Multilingual Regional Language & Speech Synthesis (TTS) Architecture

SARTHI provides native accessibility across **11 Indian Regional Languages**:
- **English** (`en`)
- **हिन्दी — Hindi** (`hi`)
- **मराठी — Marathi** (`mr`)
- **ગુજરાતી — Gujarati** (`gu`)
- **বাংলা — Bengali** (`bn`)
- **தமிழ் — Tamil** (`ta`)
- **తెలుగు — Telugu** (`te`)
- **ಕನ್ನಡ — Kannada** (`kn`)
- **മലയാളം — Malayalam** (`ml`)
- **ਪੰਜਾਬੀ — Punjabi** (`pa`)
- **ଓଡ଼િଆ — Odia** (`or`)

### Dual-Layer Text-to-Speech Architecture (`TextToSpeechProvider`)

```
Selected Language
       ↓
  TTS Manager
       ↓
Is device voice available?
       ↓
YES → BrowserTTSProvider (Dynamic locale discovery + utterance chunking)
       ↓
NO
       ↓
BackendTTSProvider (`POST /api/accessibility/tts`)
       ↓
Audio playback / Honest device notice
```

1. **Client-Side Web Speech API (`BrowserTTSProvider`):**
   - Asynchronously detects all available device/browser voices via `speechSynthesis.getVoices()`.
   - Matches language tags dynamically (`mr-IN`, `hi-IN`, `gu-IN`, `ta-IN`, `te-IN`, `bn-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `or-IN`, `en-IN`) without hardcoding voice names.
   - **Utterance Chunking:** Automatically divides lengthy documents into sentence-level chunks (`।`, `.`, `!`, `?`) to prevent browser speech synthesis cutoffs or hangs on long texts.
   - **Playback Controls:** Full support for Pause, Resume, and Stop controls across sentences.
   - **Truthful Voice Availability Notice:** If a browser or OS lacks an installed voice pack for a given language, SARTHI **never fakes speech** or shows a synthetic "playing" state. It truthfully informs the user:
     `"Voice is not available on this device/browser for <Language>"` and renders the 100% complete visual translation.
2. **Pluggable Cloud TTS Backend (`BackendTTSProvider`):**
   - Implemented via `frontend/src/services/voice/textToSpeechProvider.js` and `POST /api/accessibility/tts`.
   - Supports server-side regional speech synthesis (e.g. Google Cloud Text-to-Speech with `TTS_API_KEY`).
   - Server-side credentials remain 100% confidential and are never exposed to the Vite frontend bundle.

### Multilingual Voice Assistant ("Hey Sarthi")
SARTHI's hands-free voice assistant understands multilingual commands and questions:
- `"Hey Sarthi, explain this in Marathi"` → Switches active language to Marathi, responds in native script (`"मी ऐकत आहे..."`), and plays Marathi speech.
- `"Hey Sarthi, translate this to Hindi"` → Switches to Hindi with Devanagari guidance.
- `"मराठीत हे समजावून सांग"` → Direct native script recognition and execution.
- `"Hey Sarthi, read this in Tamil"` → Activates Tamil language mode.


---

## 11. Known Limitations & Browser Compatibility

In full adherence to engineering transparency:

| Feature | Limitation Type | Behavior & Fallback |
| :--- | :--- | :--- |
| **Marathi TTS** | Browser/OS limitation | If the OS does not have a native Marathi TTS engine installed, SARTHI displays *"Marathi voice is not available on this device/browser."* The visual Marathi translation remains fully accessible and readable. |
| **Microphone STT** | Browser limitation | Requires `webkitSpeechRecognition` or `SpeechRecognition` (available in Chrome, Edge, Safari). Unsupported browsers display: *"Voice input isn't supported in this browser. You can type your question instead."* |
| **SARTHI Vision** | Implementation boundary | SARTHI Vision is an assistive reading, object description, and document aid. It does **not** provide physical collision avoidance, obstacle navigation, or mobility guidance in physical spaces. |
| **Live AI Analysis** | Environment variable | Real document and multimodal vision analysis requires `GEMINI_API_KEY` in `backend/.env`. If unconfigured, the app provides a clear configuration notice and includes pre-verified reference samples for instant evaluation. |
| **Database Persistence** | Hybrid architecture | Uses MongoDB Atlas when `MONGODB_URI` is provided; seamlessly falls back to an in-memory repository store if MongoDB is offline or unconfigured. |

---

## 12. Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Link your repository in [Vercel](https://vercel.com).
3. Set the Root Directory to `frontend`.
4. Build command: `npm run build`, Output directory: `dist`.
5. Set environment variable: `VITE_API_URL=https://<your-backend-domain>.onrender.com/api`.
6. Deploy! The included `vercel.json` automatically handles client-side routing rewrites.

### Backend Deployment (Render)
1. In [Render](https://render.com), create a new **Web Service** from your repository.
2. Set Root Directory to `backend`.
3. Build command: `npm install`, Start command: `npm start`.
4. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your-mongodb-atlas-uri>`
   - `JWT_SECRET=<strong-random-key>`
   - `GEMINI_API_KEY=<your-google-gemini-key>`
   - `CLIENT_URL=https://<your-frontend-domain>.vercel.app`
5. Deploy! Health check endpoint is available at `/api/health`.

---

## 13. Ethical AI & Disclaimers

SARTHI is designed to assist and explain information, not replace legal or medical authority.
- When critical information (such as a legal deadline or medical dosage) is analyzed, SARTHI advises users to verify with the original issuing entity.
- Grounded prompts explicitly prevent hallucination: if a detail is not in the source text, SARTHI truthfully states: *"I couldn't find that information in the provided content."*

---

## 14. License

Distributed under the MIT License. See `LICENSE` for details.

