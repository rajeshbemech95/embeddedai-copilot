# EmbeddedAI Copilot

An authenticated AI engineering assistant for embedded systems, firmware developers, and IoT architects.

---

## 🛠️ Architecture Overview

```
               [ Browser Client ]
              /                  \
             /                    \
  Firebase Auth & Firestore       Express + Vite Proxy
  (Direct User UID Scope)         (Backend API on Cloud Run)
             |                             |
      Zero-Trust ABAC                      | (GEMINI_API_KEY)
      Security Rules                       v
                                   Gemini 2.5 Flash
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Backend API**: Express.js server bundled with `esbuild`, hosting Vite middleware in development and serving compiled static SPA in production.
- **AI Core**: Gemini 3.8 Flash via `@google/genai` on server side.
- **Identity & Authentication**: Firebase Authentication with Google Sign-In.
- **Database & Persistence**: Google Cloud Firestore, strictly isolated per user UID (`/users/{userId}/*`).
- **Deployment**: Google Cloud Run listening dynamically on `process.env.PORT`.

---

## ⚡ Core Features

1. **Multi-Turn AI Chat**:
   - Persona: Senior Embedded Systems & IoT Firmware Architect.
   - Specializations: ESP32 / ESP8266, ARM Cortex-M, Embedded Linux, FreeRTOS, Zephyr RTOS, CAN / CAN-FD, SPI, I2C, UART, BLE, Wi-Fi, MQTT.
   - Preserves multi-turn message history in Firestore subcollections.
   - Dynamic Project Context injection.

2. **Deep Firmware Code Analyzer**:
   - Audits embedded C/C++/Rust/Python routines.
   - Categorized diagnostics: Compilation issues, runtime risks, memory & stack depth, concurrency hazards (ISR reentrancy, volatile correctness), deterministic timing & watchdog starve risk, hardware error handling.
   - Includes 4 built-in embedded bug presets (ESP32 ISR leak, FreeRTOS priority inversion, STM32 DMA buffer hazard, I2C lockup).
   - Generates production-ready, remediated code with copy button.

3. **Project Registry**:
   - Create and organize hardware projects (e.g. *ESP32 IoT Monitor*, *MQTT Gateway*, *Embedded Linux Network Manager*, *BLE GATT Server*).
   - Link project metadata to active AI chats.

4. **Audit History & Search**:
   - Unified chronological record of all consultations and registered hardware projects.

---

## 🔒 Security Model & Backend Authentication

- **Backend Firebase Admin Token Verification**:
  - Protected API endpoints (`POST /api/chat`, `POST /api/analyze`) require an HTTP `Authorization` header formatted as:
    ```http
    Authorization: Bearer <Firebase ID Token>
    ```
  - The Express backend uses `firebase-admin` to cryptographically verify the ID token's signature, issuer, audience, and expiration against Google's public x509 certificates.
  - Requests with missing, malformed, or expired tokens are immediately rejected with **HTTP 401 Unauthorized**.
  - Verified user identity (`req.user` and cryptographic `req.uid`) is attached to the request. Client-supplied UIDs in the request payload or headers are strictly discarded and never trusted.
- **Zero-Trust Firestore Rules**:
  ```javascript
  match /users/{userId} {
    allow get: if request.auth != null && request.auth.uid == userId;
    allow create, update: if request.auth != null && request.auth.uid == userId;
    
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
- **Untrusted Code**: User-submitted firmware code is analyzed semantically by Gemini; code is never executed or compiled directly on the server container.
- **Secret Protection**: `GEMINI_API_KEY` is exclusively accessed server-side in `server.ts` and never sent to browser clients.
- **Public Endpoints**: `GET /api/health` remains open for container readiness probes and does not expose secrets or API keys.

---

## 🚀 Local Development & Authenticated Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   FIREBASE_PROJECT_ID="opportune-gateway-8lkcn"
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Testing Authenticated API Endpoints**:
   - In the web app, sign in with your Google account. The frontend client automatically calls `await user.getIdToken()` and attaches the `Authorization: Bearer <token>` header to all AI Chat and Code Analyzer requests.
   - To test protected endpoints manually via `curl`:
     ```bash
     # Unauthenticated call (will return HTTP 401 Unauthorized)
     curl -i -X POST http://localhost:3000/api/chat \
       -H "Content-Type: application/json" \
       -d '{"messages":[{"role":"user","content":"Hello"}]}'

     # Authenticated call (replace <FIREBASE_ID_TOKEN> with a valid token)
     curl -i -X POST http://localhost:3000/api/chat \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"messages":[{"role":"user","content":"Explain FreeRTOS queues"}]}'
     ```
   - Healthcheck endpoint (unauthenticated):
     ```bash
     curl http://localhost:3000/api/health
     ```

5. Build production bundle:
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Google Cloud Run Deployment

### Option A: Using Google Cloud Build & Cloud Run
```bash
# 1. Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# 2. Build container image using Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/embedded-ai-copilot

# 3. Deploy to Cloud Run
gcloud run deploy embedded-ai-copilot \
  --image gcr.io/YOUR_PROJECT_ID/embedded-ai-copilot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="projects/YOUR_PROJECT_ID/secrets/GEMINI_API_KEY"
```

### Option B: Using Docker
```bash
docker build -t embedded-ai-copilot .
docker run -p 8080:8080 -e GEMINI_API_KEY="your_key" -e PORT=8080 embedded-ai-copilot
```
