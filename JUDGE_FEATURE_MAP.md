# SARTHI — Judge Feature Map & Evaluation Rubric

> **Product Name:** SARTHI  
> **Tagline:** Understand. Hear. Translate. Act.  
> **Hackathon Theme:** AI for Accessibility & Inclusion

This document provides evaluators and judges with an explicit, line-by-line verification map between the competition requirements and the implemented features in SARTHI.

---

## 1. Core Challenge Alignment

| Challenge Requirement | Implementation in SARTHI | Verification Location |
| :--- | :--- | :--- |
| **Remove communication & literacy barriers** | Plain-language AI rewriting eliminating legalese; "Make it even simpler" cognitive clarity engine with everyday analogies. | `frontend/src/components/SimplerModeView.jsx`<br>`backend/src/services/ai/geminiService.js` |
| **Enhance independent access to information** | Interactive "WHAT DO I NEED TO DO?" action checklist, tracking completed requirements with audio readouts. | `frontend/src/components/ActionChecklist.jsx`<br>`backend/src/controllers/sessionController.js` |
| **Inclusive digital experiences for diverse needs** | Universal Accessibility Toolbar: text scaling (100% to 130%), dark amber/light contrast, dyslexia reading mode, reduced motion, simplified UI. | `frontend/src/components/AccessibilityToolbar.jsx`<br>`frontend/src/context/AccessibilityContext.jsx` |
| **Multilingual accessibility** | Backend-driven translations into regional languages (Marathi, Hindi, Gujarati, Tamil, Spanish) preserving dates and numbers. | `frontend/src/components/TranslationTab.jsx`<br>`backend/src/services/ai/prompts.js` |
| **Auditory & Voice interaction** | Web Speech API speech synthesis with speed/pitch controls and animated sound bars; speech recognition for voice Q&A. | `frontend/src/components/AudioPlayerDock.jsx`<br>`frontend/src/components/GroundedQnA.jsx` |

---

## 2. Technical Stack Compliance

| Layer | Requirement | Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | React.js, Vite | React 18 with Vite 5, ES modules, fast HMR | ✅ Compliant |
| **Routing** | React Router | React Router DOM v6 with SPA rewrites | ✅ Compliant |
| **Styling** | Tailwind CSS | Tailwind CSS with WCAG theme classes | ✅ Compliant |
| **Networking** | Axios | Configured Axios client with Bearer interceptors | ✅ Compliant |
| **Backend** | Node.js, Express.js | Express server with modular controller/service layers | ✅ Compliant |
| **Auth** | JWT, bcrypt | Salted bcrypt password hashing + signed JWT | ✅ Compliant |
| **Validation** | Zod | Zod schemas on all API inputs and AI output | ✅ Compliant |
| **Database** | MongoDB Atlas | Mongoose with automatic fallback resilience | ✅ Compliant |
| **AI** | Google Gemini API | Multimodal vision, OCR, structured JSON generation | ✅ Compliant |
| **Deployment** | Vercel & Render | `vercel.json` and `render.yaml` configured | ✅ Compliant |

---

## 3. Product Differentiator: "WHAT DO I NEED TO DO?"

| Feature | Description | File / Component |
| :--- | :--- | :--- |
| **1. What is this?** | Executive summary in plain language answering what the document is and why it matters. | `AccessibilitySummaryCard.jsx` |
| **2. What matters?** | Key takeaway points highlighting benefits and eligibility criteria. | `SimplerModeView.jsx` |
| **3. What do I need?** | Extracted list of mandatory documents and proof certificates with purpose. | `AccessibilitySummaryCard.jsx` |
| **4. What do I need to do?** | Interactive checklist with progress bar and per-action audio playback. | `ActionChecklist.jsx` |
| **5. What happens next?** | Sequential step-by-step guidance showing one focused card at a time. | `StepByStepCard.jsx` |
| **6. Are there deadlines?** | Urgency-ranked deadlines extracted from text (e.g., October 15 cutoff). | `AccessibilitySummaryCard.jsx` |
| **7. What info is missing?** | AI flags gaps in notices (e.g. unstated payment mode or missing helpdesk phone). | `AccessibilitySummaryCard.jsx` |
| **8. Can I hear this?** | Persistent audio player dock with play, pause, stop, and speed toggles. | `AudioPlayerDock.jsx` |
| **9. Can I translate this?** | Complete localized explanations and actions in Marathi, Hindi, and more. | `TranslationTab.jsx` |
| **10. Can I ask questions?** | Grounded Q&A strictly against document with zero hallucination. | `GroundedQnA.jsx` |

---

## 4. Accessibility Testing & WCAG Conformance

| WCAG Criteria | Implementation | Verification in Code |
| :--- | :--- | :--- |
| **1.3.1 Info & Relationships** | Semantic HTML headings (`h1` through `h4`), landmarks (`main`, `nav`, `header`, `footer`, `region`). | All JSX page and component templates |
| **1.4.3 Contrast (Minimum)** | High contrast dark mode (amber on black) & light mode (monochrome black on white) exceeding 7:1 ratio. | `frontend/src/index.css` (`.contrast-dark`, `.contrast-light`) |
| **1.4.4 Resize Text** | 100%, 115%, and 130% root HTML rem scaling without breaking layouts. | `AccessibilityToolbar.jsx` & `index.css` |
| **2.1.1 Keyboard Navigation** | All buttons, tabs, inputs, and checkboxes operable via Tab, Enter, and Space keys. | Universal `:focus-visible` styling and accessible button tags |
| **2.4.1 Bypass Blocks** | Skip-to-content link positioned at the top of DOM (`#main-content`). | `frontend/src/components/SkipLink.jsx` |
| **2.4.7 Focus Visible** | 3px high-visibility amber outline on all focused interactive elements. | `frontend/src/index.css` (`:focus-visible`) |
| **4.1.3 Status Messages** | Real-time screen reader announcements for actions and tab changes using `aria-live="polite"`. | `frontend/src/context/AccessibilityContext.jsx` |

---

## 5. Security & Privacy Audit

- **No Secrets in Frontend:** Google Gemini API keys and JWT secrets are strictly managed in the backend environment.
- **Rate Limiting:** Protects against brute-force authentication and AI quota exhaustion (`rateLimiter.js`).
- **Input Sanitization:** Multipart file upload validation ensures only PDF and allowed image formats (max 10 MB) are processed in memory.
- **Zero Hallucination:** Prompt engineering prevents invention of dates, fees, or requirements. If missing, SARTHI explicitly outputs: *"I couldn't find that information in the provided content."*
