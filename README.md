# EmbeddedAI Copilot

EmbeddedAI Copilot is an authenticated AI assistant built specifically for embedded systems and IoT engineers, firmware developers, and hardware architects. It combines deep domain intelligence for real-time operating systems, low-level peripherals, and bare-metal architectures with an enterprise-grade cloud security model.

- **Public Application URL**: [https://embeddedai-copilot.ai.studio/](https://embeddedai-copilot.ai.studio/)
- **GitHub Repository**: [https://github.com/rajeshbemech95/embeddedai-copilot](https://github.com/rajeshbemech95/embeddedai-copilot)
- **Google Cloud Project ID**: `opportune-gateway-8lkcn`

---

## 🏆 Challenge Overview

EmbeddedAI Copilot demonstrates the unified power of the Google Cloud and Firebase ecosystems running together:

- **Firebase Authentication**: Secures client access via Google Sign-In and issues cryptographic JSON Web Tokens (JWTs).
- **Cloud Firestore**: Provides user-isolated, real-time persistence for hardware projects, multi-turn chat sessions, and firmware audit logs.
- **Gemini API**: Powers deep semantic reasoning for embedded systems architecture, deterministic timing, memory constraints, and automated code remediation.
- **Google Cloud Run**: Hosts the unified containerized application (React frontend and Express backend), scaling automatically on managed infrastructure with server-side secret management.

---

## 💻 Technology Stack

- **Google AI Studio**: Prompt design, testing, and AI workflow prototyping.
- **Gemini API**: Server-side multimodal AI reasoning through the modern `@google/genai` SDK.
- **React**: Modern component-based user interface styled with Tailwind CSS and Lucide icons.
- **TypeScript**: End-to-end static type safety across frontend and backend.
- **Express.js**: Backend application server serving API endpoints and production assets.
- **Firebase Authentication**: Secure Google OAuth authentication and token lifecycle management.
- **Cloud Firestore**: Serverless NoSQL document database enforcing strict user-level data isolation.
- **Google Cloud Run**: Serverless container hosting listening dynamically on the designated port.

---

## 🏛️ System Architecture

The application implements a zero-trust, authenticated architecture separating client presentation, backend verification, server-side AI execution, and isolated data persistence:

```
Browser
  │
  ├──► Firebase Authentication (Google Sign-In & ID Token issuance)
  │
  └──► React Frontend
         │
         │ (Authorization: Bearer <Firebase ID Token>)
         ▼
       Cloud Run / Express Backend (Firebase Admin token verification)
         │
         │ (Server-side GEMINI_API_KEY)
         ▼
       Gemini API
```

Data isolation is strictly anchored to verified identities:

```
Firebase Authentication UID
  │
  ▼
Firestore User-Isolated Data (/users/{userId}/*)
  ├── /projects/{projectId}
  └── /conversations/{conversationId}/messages/{messageId}
```

---

## ⚡ Custom Features

- **Multi-turn Embedded Systems AI Chat**:
  - Embedded systems and IoT specialist persona covering ESP32, ARM Cortex-M, STM32, Embedded Linux, FreeRTOS, Zephyr RTOS, CAN/CAN-FD, I2C, SPI, UART, BLE, Wi-Fi, and MQTT.
  - Full multi-turn conversational memory with persistent chat history.
  - Active Project Context injection linking registered hardware constraints directly into discussions.

- **Embedded C/C++/Rust/Python Code Analyzer**:
  - Deep automated diagnostics for embedded firmware without executing untrusted code on the container.
  - **Memory and stack analysis**: Evaluates stack frame depth, dynamic heap allocation risks, buffer boundaries, and SRAM exhaustion.
  - **Concurrency and ISR analysis**: Detects race conditions, ISR reentrancy, missing `volatile` qualifiers, and improper mutex acquisition inside interrupt handlers.
  - **Timing and watchdog analysis**: Flags blocking delays (`vTaskDelay`, spinlocks), priority inversions, and hardware watchdog (WDT) starvation hazards.
  - **Hardware/bus error analysis**: Detects unhandled peripheral errors, I2C bus hang conditions, SPI framing slips, and DMA buffer alignment flaws.
  - **ESP32/FreeRTOS/STM32/I2C diagnostic presets**: Built-in test cases for immediate reproduction of classic firmware defects.
  - Generates production-ready remediated code side-by-side with complete technical explanations.

- **Project Registry**:
  - Catalog hardware boards, chipsets, clock frequencies, bus topologies, and peripheral pinouts.
  - Direct integration between hardware project profiles and active AI consultations.

- **Conversation and Audit History**:
  - Searchable, chronological archive of firmware audits, code remediations, and engineering discussions.

---

## 🔒 Security Model

- **Firebase Google Sign-In**: Client authentication through standard Firebase Authentication flows.
- **Backend Firebase ID-Token Verification**:
  - Protected API endpoints (`POST /api/chat` and `POST /api/analyze`) require an `Authorization: Bearer <Firebase ID Token>` header.
  - The Express backend uses the `firebase-admin` SDK to verify signature, expiration, issuer, and audience against Google's public x509 certificates.
  - Missing, malformed, or expired tokens receive an immediate `HTTP 401 Unauthorized`.
- **UID-Based Firestore Isolation**:
  - Data paths are scoped under `/users/{userId}/*`.
  - The client UID is never trusted blindly from request bodies; access is bound strictly to the cryptographically verified token identity.
- **Server-Side Gemini API Key**:
  - The `GEMINI_API_KEY` is strictly accessed on the server side in `server.ts`.
  - The key is never exposed to frontend JavaScript or client bundle builds.
- **User-Submitted Code is Never Executed**:
  - Firmware code submitted to the Code Analyzer is parsed semantically via the Gemini API.
  - No user code is executed, compiled, or flashed on the server or container filesystem.
- **Firestore Security Rules**:
  - Zero-trust security rules enforce that users can only read, create, update, and delete documents within their own UID subtree:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId} {
          allow get, create, update: if request.auth != null && request.auth.uid == userId;
          
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
      }
    }
    ```

---

## 🚀 Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/rajeshbemech95/embeddedai-copilot.git
   cd embeddedai-copilot
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file at the root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   FIREBASE_PROJECT_ID=opportune-gateway-8lkcn
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. **Testing Authenticated API Endpoints**:
   - In the web app, sign in with your Google account. The frontend client retrieves the fresh Firebase ID token via `user.getIdToken()` and includes it in all requests to `/api/chat` and `/api/analyze`.
   - To test via `curl`:
     ```bash
     # Unauthenticated request (returns 401 Unauthorized)
     curl -i -X POST http://localhost:3000/api/chat \
       -H "Content-Type: application/json" \
       -d '{"messages":[{"role":"user","content":"Hello"}]}'

     # Authenticated request
     curl -i -X POST http://localhost:3000/api/chat \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"messages":[{"role":"user","content":"Explain FreeRTOS queue sets"}]}'
     ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Google Cloud Run Deployment

EmbeddedAI Copilot is containerized and runs on Google Cloud Run in Google Cloud project `opportune-gateway-8lkcn`.

### Secret Management
For production security on Cloud Run, the `GEMINI_API_KEY` must never be passed as a plain-text command-line argument or stored unencrypted in build files. Instead, manage the API key securely using **Google Cloud Secret Manager**:

1. Store the Gemini API key in Secret Manager:
   ```bash
   echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
     --project opportune-gateway-8lkcn \
     --data-file=-
   ```

2. Grant the Cloud Run service account access to read the secret:
   ```bash
   gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
     --project opportune-gateway-8lkcn \
     --member="serviceAccount:YOUR_SERVICE_ACCOUNT@opportune-gateway-8lkcn.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. Build and deploy the container to Cloud Run, referencing the secret directly:
   ```bash
   # Build the container image using Cloud Build
   gcloud builds submit --tag gcr.io/opportune-gateway-8lkcn/embeddedai-copilot --project opportune-gateway-8lkcn

   # Deploy to Cloud Run with Secret Manager binding
   gcloud run deploy embeddedai-copilot \
     --image gcr.io/opportune-gateway-8lkcn/embeddedai-copilot \
     --project opportune-gateway-8lkcn \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
   ```

Cloud Run injects the secret payload directly into the server's execution environment as `process.env.GEMINI_API_KEY` at runtime, keeping all API credentials secure and confidential.
