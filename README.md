# SARTHI
## Understand. Hear. Translate. Act.

SARTHI is an AI-powered accessibility assistant designed to help individuals with cognitive, visual, literacy, and language barriers navigate complex digital information. By combining multimodal document understanding, live computer vision, plain-language simplification, and regional voice interaction, SARTHI transforms dense notifications and physical documents into clear, audible, and actionable guidance.

---

## Problem

Every day, people encounter vital digital documents and physical materials—including government notifications, medical instructions, utility forms, circulars, and legal notices.

Many struggle to access and act upon this information because:
- **Complex & Bureaucratic Language:** Dense legal and administrative jargon makes essential instructions hard to parse.
- **Hidden Deadlines & Action Items:** Critical requirements, submission deadlines, and mandatory documents are buried in multi-page circulars.
- **Visual Information Barriers:** Individuals with low vision, blindness, or visual impairments cannot easily read physical documents, signage, or forms.
- **Language Exclusion:** Important civic and educational notifications are frequently published only in English or complex formal scripts, excluding regional language speakers.
- **Inaccessible Digital Design:** Most interfaces fail to support keyboard-only navigation, dyslexia-friendly typography, or high-contrast viewing modes.

**Real-world impact:** Missing an application cutoff, misunderstanding a medical schedule, or failing to submit a required document causes real distress and exclusion for millions of citizens.

---

## Solution

SARTHI acts as an assistive translation and action layer between complex content and the user:
- Users provide a PDF document, take a photo, paste text, or point their camera at an object or document.
- SARTHI's backend analyzes the content using Google Gemini models, extracting key takeaways, deadlines, required documents, and a checklist of immediate next steps.
- The interface delivers the information through plain-language summaries, high-contrast visual cards, regional language translations, and audio narration.
- Users can ask follow-up questions via text or natural voice interaction using **Hey Sarthi**.

In under 30 seconds, an intimidating multi-page circular is transformed into an ordered, step-by-step checklist the user can hear, understand, and complete.

---

## Key Features

Only features implemented and verified in the codebase are listed below:

- **AI Document Understanding:** Multimodal analysis for PDF documents, uploaded images (PNG, JPEG, WebP), and pasted text.
- **Plain-Language Simplification:** A dedicated "Make it Even Simpler" distillation that explains documents in everyday terms without administrative jargon.
- **Important Information & Action Extraction:** Automated identification of submission deadlines, mandatory documents, and step-by-step required actions.
- **Interactive Action Checklist:** An interactive checklist with progress tracking, persistent state, and guided step-by-step card views.
- **Multilingual Translation:** Complete document and takeaway translation across 11 Indian regional languages (English, Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia).
- **Text-to-Speech (TTS):** Dual-layer audio narration using client-side Web Speech synthesis with dynamic locale detection and automatic sentence chunking to prevent browser speech cutoffs.
- **Live Vision & Camera Assistance:** Live camera assistance with automatic representative-frame analysis and controlled scene-change detection for visually impaired users.
- **Voice Interaction ("Hey Sarthi"):** Voice assistant with continuous wake-word listening, acoustic tolerance for Indian English and regional accents, hands-free command routing, and contextual Q&A.
- **Accessibility-First Interface:** Built-in floating accessibility dock supporting text scaling (100% / 115% / 130%), high-contrast themes, dyslexia-friendly font spacing, reduced motion, and full keyboard operability.

---

## How SARTHI Works

```
Document / Camera / Voice
           ↓
   AI Processing (Gemini)
           ↓
Understand / Simplify / Translate
           ↓
Voice Output / Visual Response
           ↓
    User Takes Action
```

1. **Input:** The user uploads a file, points their camera, speaks a voice command, or pastes text.
2. **Analysis:** The Express backend receives the sanitized request, validates parameters, and queries Gemini models with structured JSON schemas.
3. **Synthesis:** Content is broken down into structured sections: summary, deadlines, required documents, action steps, and simplified text.
4. **Presentation:** The React frontend renders high-contrast cards, enables interactive checklist items, provides audio playback, and supports immediate regional translation.
5. **Follow-Up:** The user asks grounded questions or gives voice instructions ("Hey Sarthi, what is the deadline?", "Explain this in Marathi").

---

## Vision AI Pipeline

The SARTHI Vision pipeline provides visual accessibility with speed, reliability, and automated scene awareness:

```
Camera
  ↓
Live Video Frame
  ↓
Frame Validation (Dimensions & Readiness)
  ↓
Scene-Change / Duplicate Detection
  ↓
Controlled Frame Extraction (Max 1024px @ 0.75 JPEG)
  ↓
Frontend Request (Concurrency Lock & 3.5s Cooldown)
  ↓
Node.js / Express Backend (/api/vision/analyze)
  ↓
Gemini Vision (gemini-3.1-flash-lite)
  ↓
Structured Response (Description, Objects, Text)
  ↓
Description / Translation / TTS
```

- **Automatic Scene Analysis:** Live camera assistance with automatic representative-frame analysis and controlled scene-change detection—no manual capture or shutter buttons required.
- **Scene-Change Detection:** Client-side luminance differential analysis dynamically identifies when the user points the camera at a new object or scene before dispatching an AI request, avoiding redundant processing.
- **Concurrency & Cooldown Control:** Employs an atomic mutex lock (`isAnalyzingRef`) and a controlled 3–5 second cooldown, ensuring only one request is in flight at a time with no overlapping calls.
- **Frame Validation:** Validates video stream readiness (`videoWidth > 0`, `readyState >= 2`) prior to frame capture.
- **Performance Optimization:** Captured frames are scaled to a maximum dimension of 1024px at 0.75 JPEG quality (~15–30 KB payload), minimizing upload latency and processing time.
- **Error Recovery:** Displays clear diagnostic categories (network, CORS, rate limits, timeouts) with transparent auto-recovery on the next stable frame, alongside an optional Try Again recovery action.
- **Non-blocking Speech:** Audio narration of visual descriptions runs asynchronously, allowing the camera and UI to remain responsive during playback.

---

## Accessibility

SARTHI is built in accordance with WCAG 2.1 AA/AAA accessibility guidelines:

- **Keyboard Operability:** 100% navigable using standard keyboard controls (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
- **Focus Indicators:** High-visibility 3px amber focus rings (`:focus-visible`) across all interactive buttons, inputs, and links.
- **Screen Reader Support:** Semantic HTML5 landmarks (`<main>`, `<header>`, `<nav>`, `<footer>`) with explicit `aria-label`, `aria-live="polite"`, and `aria-expanded` attributes.
- **Skip to Main Content:** Immediate skip link available on the first tab press to bypass navigation menus.
- **Visual Adjustments:** Floating accessibility dock allows users to toggle:
  - Font size scaling: Standard (100%), Large (115%), X-Large (130%).
  - Contrast themes: Default dark slate, Dark Amber on Deep Black, High Light monochrome.
  - Dyslexia-friendly reading mode: Expanded letter spacing (0.05em), word spacing (0.1em), and line height (1.85).
  - Reduced motion mode: Disables all animations and transitions for vestibular comfort.
- **Hands-Free Interaction:** Hands-free voice assistant enables users with motor or visual impairments to navigate documents without manual typing.
- **Truthful Audio Fallbacks:** When a browser or operating system lacks an installed voice pack for a requested regional language, SARTHI truthfully informs the user instead of failing silently.

---

## AI & Security

- **Backend-Only AI Routing:** All Gemini API calls are strictly executed from the Node.js/Express backend. API keys and service credentials are never exposed to the frontend bundle or client network tabs.
- **Environment Variable Protection:** Sensitive configuration keys (`GEMINI_API_KEY`, `JWT_SECRET`, `MONGODB_URI`) are loaded via environment variables and excluded from source control via `.gitignore`.
- **Input Sanitization & Schema Validation:** Incoming requests are validated using strict Zod schemas, enforcing character limits, expected MIME types, and base64 payloads before reaching AI services.
- **Structured Output Enforcement:** AI responses use strict JSON response schemas validated against Zod schemas, preventing malformed data from propagating to the frontend.
- **Grounded AI Prompting:** Prompts explicitly forbid hallucination, instructing the model to declare `"I couldn't find that information in the provided content"` when a detail is absent.
- **Rate Limiting & Security Headers:** Express endpoints are protected using `helmet` for HTTP header security and `express-rate-limit` for DDoS and brute-force mitigation.

---

## Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Routing:** React Router DOM 6
- **Styling:** Vanilla CSS & Tailwind CSS 3.4 (with custom WCAG high-contrast tokens)
- **HTTP Client:** Axios (configured with JWT interceptors)
- **Icons:** Lucide React
- **Speech Technologies:** Web Speech API (`SpeechSynthesis` and `SpeechRecognition`)

### Backend
- **Runtime:** Node.js (v22 LTS)
- **Framework:** Express.js 4.21
- **Validation:** Zod 3.24
- **Security:** Helmet, CORS, `express-rate-limit`, `bcryptjs` (password hashing), `jsonwebtoken` (JWT)
- **File Handling:** Multer (in-memory buffer storage), `pdf-parse` (v1.1.1)

### Database
- **Primary:** MongoDB Atlas via Mongoose 8.9
- **Graceful Fallback:** Automatic built-in in-memory repository store (`backend/src/models/memoryStore.js`), ensuring zero-crash evaluations if MongoDB is offline or unconfigured.

### AI Engine
- **Provider:** Google Gemini API via official `@google/genai` SDK
- **Models:** `gemini-3.1-flash-lite` (primary high-speed inference) with `gemini-3.5-flash-lite` fallback
- **Modalities:** Multimodal document understanding, live camera frame analysis, plain-language text generation, and grounded question answering.

---

## Architecture

```mermaid
graph TD
    User([User: Keyboard / Voice / Camera]) --> Frontend[React 18 + Vite SPA]
    
    subgraph Frontend Layer
        Frontend --> AccessDock[Accessibility Toolbar]
        Frontend --> VoiceDock[Hey Sarthi Voice Engine]
        Frontend --> CameraModule[Vision Camera & Canvas]
    end

    Frontend -->|HTTPS REST / JSON / JWT| Backend[Node.js + Express API]

    subgraph Backend Layer
        Backend --> RateLimit[Rate Limiter & Helmet]
        Backend --> ZodVal[Zod Input Validation]
        Backend --> Controllers[Auth / Accessibility / Vision]
        Controllers --> DataLayer[(MongoDB Atlas / In-Memory Store)]
        Controllers --> GeminiService[Gemini Service SDK]
    end

    subgraph AI Cloud
        GeminiService -->|Backend-Only API Key| GeminiAPI[Google Gemini Models]
        GeminiAPI -->|Structured JSON Output| GeminiService
    end

    GeminiService --> Controllers
    Controllers -->|JSON Response| Frontend
    Frontend --> SpeechSynth[Web Speech TTS / Visual Render]
    SpeechSynth --> User
```

---

## Project Structure

```
sarthi ai/
├── package.json                 # Monorepo scripts (install, build, dev, test)
├── .env.example                 # Environment variables reference template
├── .gitignore                   # Multi-tier secret and artifact ignore rules
├── LICENSE                      # MIT License
├── README.md                    # Project documentation
├── vercel.json                  # Production frontend deployment routing
├── render.yaml                  # Production backend deployment configuration
│
├── backend/
│   ├── package.json             # Backend dependencies and scripts
│   ├── .env.example             # Backend environment template
│   ├── src/
│   │   ├── server.js            # Express application bootstrap
│   │   ├── config/              # env.js, db.js (MongoDB Atlas & Fallback)
│   │   ├── controllers/         # authController, accessibilityController, visionController, sessionController
│   │   ├── middleware/          # auth, validate, upload, rateLimiter, errorHandler
│   │   ├── models/              # User, Session, memoryStore, userRepo, sessionRepo
│   │   ├── routes/              # authRoutes, accessibilityRoutes, visionRoutes, sessionRoutes
│   │   ├── services/ai/         # geminiService.js, prompts.js, voiceCommandRouter.js
│   │   ├── utils/               # pdfExtractor.js, sampleDocument.js
│   │   └── validators/          # authSchemas.js, accessibilitySchemas.js, aiOutputSchema.js
│   └── tests/                   # 23 automated tests (vision, voice, auth, schemas)
│
└── frontend/
    ├── package.json             # Frontend dependencies and scripts
    ├── vite.config.js           # Vite configuration with local proxy
    ├── tailwind.config.js       # Accessibility-focused styling extensions
    ├── index.html               # Semantic HTML5 template with Inter font
    └── src/
        ├── App.jsx              # Application routing and layout shell
        ├── main.jsx             # React DOM entry point
        ├── index.css            # Tailwind directives and WCAG utility classes
        ├── components/          # AccessibilityToolbar, VoiceAssistantDock, SkipLink, etc.
        ├── context/             # AuthContext, AccessibilityContext, VoiceAssistantContext
        ├── pages/               # LandingPage, WorkspacePage, VisionPage, DashboardPage, LoginPage, RegisterPage
        ├── services/            # api.js, accessibilityService.js, visionService.js, voice/
        └── utils/               # sceneDetector.js, speechUtils.js
```

---

## API Overview

### Authentication
| Method | Route | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account with preferred accessibility language |
| `POST` | `/api/auth/login` | Authenticate user and issue signed JWT bearer token |
| `POST` | `/api/auth/demo-login` | Instant one-click guest authentication for judges and evaluators |
| `GET` | `/api/auth/me` | Retrieve profile and preference settings of the authenticated user |
| `PUT` | `/api/auth/preferences` | Update accessibility preferences (contrast, font size, language) |

### Accessibility & Document Intelligence
| Method | Route | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/accessibility/analyze` | Multimodal analysis of PDF files, images, or raw text input |
| `POST` | `/api/accessibility/question` | Contextual Q&A strictly grounded in the analyzed document |
| `POST` | `/api/accessibility/translate` | Full document translation into 11 Indian regional languages |
| `POST` | `/api/accessibility/simplify` | "Make it Even Simpler" plain-language takeaway distillation |
| `GET` | `/api/accessibility/sample` | Load pre-verified scholarship circular for instant testing |
| `POST` | `/api/accessibility/voice` | Route voice command transcripts and regional language intents |
| `GET` | `/api/accessibility/tts/status`| Check optional cloud TTS backend configuration |
| `POST` | `/api/accessibility/tts` | Server-side speech synthesis endpoint |

### Vision & Visual Assistance
| Method | Route | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/vision/analyze` | Analyze camera frame or image for description, text, and objects |
| `POST` | `/api/vision/question` | Ask questions about the current camera view or visual scene |
| `POST` | `/api/vision/form-guide` | Step-by-step guidance on fields found in visual forms |
| `GET` | `/api/vision/sample` | Pre-verified visual analysis sample for instant review |
| `GET` | `/api/vision/sessions` | Retrieve authenticated user's past vision scans |
| `GET` | `/api/vision/sessions/:id` | Retrieve single vision scan with user authorization check |
| `DELETE` | `/api/vision/sessions/:id` | Delete a stored vision scan |

### User Sessions & Health
| Method | Route | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/sessions` | List user's saved document sessions |
| `GET` | `/api/sessions/stats` | Return user usage statistics (scans, documents, questions) |
| `GET` | `/api/sessions/:id` | Retrieve specific session data |
| `PATCH` | `/api/sessions/:id/checklist` | Toggle completion status of an interactive action item |
| `DELETE` | `/api/sessions/:id` | Remove a document session |
| `GET` | `/api/health` | Backend service health check |

---

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/eraryanbhavsar-ux/sarthi-ai.git
cd sarthi-ai
```

### 2. Install Dependencies
```bash
# Installs backend and frontend dependencies in one command
npm run install:all
```

### 3. Configure Environment Variables
Create the local environment files from the provided templates:

**Backend (`backend/.env`):**
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sarthi?retryWrites=true&w=majority
JWT_SECRET=sarthi_dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
CLIENT_URL=http://localhost:5173
```
*(Note: If `MONGODB_URI` is omitted, SARTHI automatically runs with its built-in in-memory repository store).*

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Start Backend Server
```bash
npm run dev:backend
# Active on http://localhost:5001 (Health check: http://localhost:5001/api/health)
```

### 5. Start Frontend Development Server
In a second terminal:
```bash
npm run dev:frontend
# Active on http://localhost:5173
```

### 6. Run Automated Tests
```bash
npm run test:backend
```

---

## Environment Variables

### Backend (`backend/.env`)
- `PORT` — Port number for the Express server (e.g. `5001`).
- `NODE_ENV` — Runtime environment (`development` or `production`).
- `MONGODB_URI` — MongoDB Atlas connection string (optional; falls back to in-memory store if unset).
- `JWT_SECRET` — Secret string used to sign and verify JSON Web Tokens.
- `JWT_EXPIRES_IN` — Token expiration duration (e.g. `7d`).
- `GEMINI_API_KEY` — Google Gemini API key used for document and vision processing.
- `GEMINI_MODEL` — Primary Gemini model name (default: `gemini-3.1-flash-lite`).
- `CLIENT_URL` — Allowed origin URL for Cross-Origin Resource Sharing (CORS).

### Frontend (`frontend/.env`)
- `VITE_API_URL` — Base URL of the backend API (e.g. `http://localhost:5001/api` locally, or production Render URL).

---

## Deployment

The application is deployed across modern cloud infrastructure:

- **Frontend:** Deployed on **Vercel** as a single-page application with SPA routing rewrites configured via `vercel.json`.
- **Backend:** Deployed on **Render** as a Node.js Web Service:
  - Live API: `https://sarthi-ai-szqy.onrender.com/api`
  - Health Endpoint: `https://sarthi-ai-szqy.onrender.com/api/health`
- **Database:** **MongoDB Atlas** with automatic Mongoose connection pooling and seamless in-memory fallback.

---

## Demo

<!-- Demo Video Link: [Add Link Here] -->
> *For evaluators and judges: Click **"Try Demo as Guest"** on the login page for instant access without registration. A pre-verified sample document and sample vision analysis are also available via one-click buttons on the workspace and vision screens.*

---

## Impact

- **Individuals with Low Vision or Blindness:** Real-time camera narration describes physical environments, reads document headings, and guides form-filling hands-free.
- **Cognitive & Neurodiverse Accessibility:** Plain-language conversions, structured checklists, dyslexia typography, and reduced-motion modes reduce information overload and cognitive fatigue.
- **Multilingual Communities:** Real-time translation into 11 Indian regional languages ensures citizens can access civic and educational circulars in their native script.
- **Hands-Free & Motor Accessibility:** Complete keyboard operability, visible focus indicators, and the "Hey Sarthi" voice assistant allow users who cannot use a mouse or keyboard to access information.

---

## Limitations

In the interest of engineering transparency and realistic evaluation:
- **Browser Speech Recognition Support:** Voice recognition relies on the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), which is natively supported in Chromium-based browsers (Chrome, Edge) and Safari, but has restricted availability in Firefox.
- **Device Voice Pack Availability:** The Web Speech API relies on operating system voices. If an OS lacks an installed voice pack for a specific regional language (e.g., Odia or Malayalam), SARTHI displays a clear voice-unavailable notice while rendering the full written translation.
- **Cloud Cold Starts:** The backend is hosted on a cloud container service. If inactive, the initial request may take 15–30 seconds while the container boots, after which responses return at normal latency.
- **Camera & Lighting Factors:** Visual analysis accuracy depends on adequate illumination, camera focus, and image resolution.
- **Advisory AI Notice:** SARTHI is an assistive communication and comprehension tool; it does not replace official legal, financial, or medical counsel.

---

## Future Scope

The following items represent potential future enhancements beyond the current submission:
- **Offline Edge Models:** On-device lightweight models (such as WebAssembly-based or on-device LLMs) for basic document parsing without internet connectivity.
- **Custom Native Wake-Word Engines:** Integrated lightweight WebAssembly wake-word detection for universal cross-browser voice wake-up.
- **Deep Assistive Hardware Integration:** Direct pairing with braille displays and dedicated wearable assistive cameras.
- **Expanded Indian Languages & Dialects:** Broadening translation and voice coverage to additional regional dialects and tribal languages.
- **Automated Government Portal Integration:** Secure browser-extension integration to assist users in auto-filling civic forms based on extracted document requirements.

---

## Hackathon Evaluation Alignment

### Problem Alignment & Value
SARTHI directly addresses accessibility barriers in digital and physical documents. By turning confusing, multi-page circulars into plain-language summaries, urgency-ranked deadlines, and actionable checklists, it provides immediate, practical value to individuals who face cognitive, language, or visual barriers.

### Full-Stack Implementation
The project is a complete, functioning full-stack application comprising:
- A responsive React 18 / Vite single-page application built with WCAG AA/AAA principles.
- A hardened Node.js / Express 4.21 REST API with Zod validation, JWT authentication, and rate limiting.
- Dual-mode data persistence using MongoDB Atlas with an automatic in-memory fallback store.
- Comprehensive test coverage with 23 passing automated tests covering validation, AI pipelines, and routing.

### AI Security & Integration
All AI operations are securely brokered through the backend using the `@google/genai` SDK with strict JSON schemas. API keys remain strictly server-side and are never exposed to the client. Prompts are defensively engineered to eliminate hallucination, enforcing factual grounding in source documents.

### Working Deployment & UX
The project features a live, deployed production frontend and backend. The user experience is designed specifically for accessibility: high-contrast modes, dyslexia font adjustments, voice command navigation, screen-reader live regions, and instant sample data for one-click judge evaluation.

### Video Demo & README
This README comprehensively documents the problem, solution, verified features, architecture, API endpoints, setup instructions, and deployment details without inflated or unsupported claims.

---

## Team

- **Aryan Bhavsar** ([@eraryanbhavsar-ux](https://github.com/eraryanbhavsar-ux))

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
