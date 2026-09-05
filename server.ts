import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

/**
 * TypeScript interface representing an Express request authenticated via Firebase Admin
 */
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
  uid?: string;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Lazy Firebase Admin SDK initialization
let firebaseAdminApp: App | null = null;
function getFirebaseAdmin(): App {
  if (!firebaseAdminApp) {
    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
    if (!projectId) {
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          projectId = config.projectId;
        }
      } catch (err) {
        console.warn("Could not read firebase-applet-config.json for Firebase Admin:", err);
      }
    }

    const apps = getApps();
    if (apps.length > 0 && apps[0]) {
      firebaseAdminApp = apps[0];
    } else {
      firebaseAdminApp = initializeApp({
        projectId: projectId || "opportune-gateway-8lkcn"
      });
    }
  }
  return firebaseAdminApp;
}

/**
 * Express middleware to verify Firebase Authentication ID tokens on protected endpoints.
 * Rejects missing or invalid tokens with HTTP 401.
 * Attaches verified decoded token and cryptographic UID to the request.
 */
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      error: "Unauthorized: Missing Authorization header. Provide 'Authorization: Bearer <Firebase ID Token>'."
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      error: "Unauthorized: Malformed Authorization header. Expected format: 'Bearer <Firebase ID Token>'."
    });
  }

  const idToken = parts[1];
  if (!idToken) {
    return res.status(401).json({
      error: "Unauthorized: Missing token string in Authorization header."
    });
  }

  try {
    const adminApp = getFirebaseAdmin();
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);

    // Cryptographically verified identity from token payload (never trust client-supplied UID)
    req.user = decodedToken;
    req.uid = decodedToken.uid;
    return next();
  } catch (error: any) {
    const code = error?.code || "";
    let message = "Unauthorized: Invalid or expired Firebase ID token.";
    if (code === "auth/id-token-expired") {
      message = "Unauthorized: Firebase ID token has expired. Please refresh your session.";
    } else if (code === "auth/id-token-revoked") {
      message = "Unauthorized: Firebase ID token has been revoked.";
    } else if (code === "auth/argument-error" || code === "auth/invalid-id-token") {
      message = "Unauthorized: Invalid Firebase ID token format or signature.";
    }

    return res.status(401).json({
      error: message,
      code: code || "auth/unauthorized"
    });
  }
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash"
].filter((m): m is string => Boolean(m));

const FALLBACK_MODELS = Array.from(new Set(CANDIDATE_MODELS));

app.use(express.json({ limit: "5mb" }));

// Lazy Google GenAI Client
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please provide it in settings or environment.");
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

/**
 * Resilient generation helper that handles transient 503 high-demand or rate-limiting
 * by retrying with backoff and falling back to alternative active Flash models.
 */
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  }
) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient = msg.includes("503") || 
                            msg.includes("high demand") || 
                            msg.includes("UNAVAILABLE") || 
                            msg.includes("429") || 
                            msg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt === 0) {
          // Brief pause before retry on same model
          await new Promise(r => setTimeout(r, 600));
        } else {
          // Cascade to next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error("AI models are experiencing high demand. Please retry momentarily.");
}

const EMBEDDED_SYSTEM_INSTRUCTION = `You are EmbeddedAI Copilot, an elite Principal Embedded Systems and IoT Engineer with 20+ years of industry experience.
You specialize in:
- Embedded C and C++ (C99, C11, C++17, C++20 for embedded)
- Embedded Linux, Buildroot, Yocto, kernel modules, device drivers, devicetree
- Microcontrollers: ESP32 / ESP8266 (ESP-IDF, FreeRTOS), ARM Cortex-M (STM32, NXP, Nordic nRF52/nRF53, RP2040, SAMD)
- Communication buses & protocols: UART, SPI, I2C, CAN / CAN-FD, Modbus RTU/TCP, LIN, RS485
- Wireless & IoT stacks: BLE / Bluetooth Mesh, Wi-Fi 802.11, MQTT, CoAP, LoRaWAN, Cellular (LTE-M/NB-IoT)
- Real-Time Operating Systems (RTOS): FreeRTOS, Zephyr RTOS, NuttX, ThreadX, CMSIS-RTOS2
- Low-level concerns: Interrupt service routines (ISRs), reentrancy, DMA, cache coherency, volatile memory, atomic operations, hardware watchdogs (WDT), low power modes (Deep Sleep, Light Sleep), stack overflow, heap fragmentation.
- Debugging tools: JTAG/SWD, OpenOCD, GDB, Segger J-Link, Saleae logic analyzer, oscilloscope, Wireshark for network protocols.

Guidelines:
1. Provide practical, production-ready, memory-safe, and robust code.
2. In explanations, highlight timing, stack/heap impact, deterministic execution, and hardware error handling.
3. Always check for buffer overflows, race conditions between task/ISR, missing volatile qualifiers, unhandled bus errors, and power-budget implications.
4. Format code blocks clearly with the appropriate language tag (c, cpp, python, rust, bash).`;

// Health check - public status endpoint (does NOT expose secrets or keys)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "EmbeddedAI Copilot API",
    authEnforced: true,
    time: new Date().toISOString()
  });
});

// AI Chat Endpoint - Protected by Firebase Authentication
app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authenticated UID comes strictly from the verified Firebase ID token (never from client body)
    const verifiedUid = req.uid;
    if (!verifiedUid) {
      return res.status(401).json({ error: "Unauthorized: Verified UID missing from token." });
    }

    const { messages, projectContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array." });
    }

    const ai = getGenAI();

    let contextualSystemPrompt = EMBEDDED_SYSTEM_INSTRUCTION;
    if (projectContext) {
      contextualSystemPrompt += `\n\nCURRENT PROJECT CONTEXT:
- Project Name: ${projectContext.projectName || "General Embedded Project"}
- Core Technology: ${projectContext.technology || "Embedded C/C++"}
- Target Chip/Platform: ${projectContext.targetChip || "Generic Microcontroller"}
- Description: ${projectContext.description || "None provided"}
Please tailor your responses specifically to this architecture, peripherals, and toolchain.`;
    }

    // Convert messages to GenAI format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }]
    }));

    const response = await generateContentWithRetryAndFallback(ai, {
      contents,
      config: {
        systemInstruction: contextualSystemPrompt,
        temperature: 0.3,
      }
    });

    const reply = response.text || "No response received from EmbeddedAI Copilot.";
    return res.json({ reply, verifiedUid });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const msg = error?.message || "";
    let userMsg = msg;
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
      userMsg = "The AI service is experiencing temporary peak demand. Please click Retry in a moment.";
    }
    return res.status(500).json({
      error: userMsg || "Failed to generate AI response. Verify GEMINI_API_KEY."
    });
  }
});

// Code Analyzer Endpoint - Protected by Firebase Authentication
app.post("/api/analyze", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authenticated UID comes strictly from the verified Firebase ID token (never from client body)
    const verifiedUid = req.uid;
    if (!verifiedUid) {
      return res.status(401).json({ error: "Unauthorized: Verified UID missing from token." });
    }

    const { code, language = "c", targetPlatform = "Generic Embedded", customContext = "" } = req.body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Source code is required for analysis." });
    }

    const ai = getGenAI();

    const prompt = `Analyze the following embedded source code as a Senior Embedded Systems Security & Firmware Architect.

TARGET PLATFORM / RTOS: ${targetPlatform}
LANGUAGE: ${language}
ADDITIONAL CONTEXT: ${customContext || "None provided"}

SOURCE CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Strictly adhere to the following evaluation requirements:
1. Identify the problems.
2. Explain the root causes.
3. Explain why it occurs in hardware/embedded runtime.
4. Provide corrected, production-ready code with defensive programming.
5. Identify edge cases (timing, bounds, overflow, NULL pointers, reentrancy).
6. Detail embedded-specific concerns:
   - Memory (stack depth, heap fragmentation, dynamic allocations in ISR)
   - Concurrency (volatile keyword, critical sections, mutex deadlocks, priority inversion)
   - Timing (blocking delays, ISR latency, watchdog kicks)
   - Error handling & bus safety (timeouts, I2C/SPI bus hang recovery)

Return your response strictly formatted as a valid JSON object matching this TypeScript structure (do not wrap in anything else):
{
  "summary": "Brief executive summary of findings and risk level (Critical, Warning, Minor, Clean)",
  "riskLevel": "Critical" | "High" | "Medium" | "Low" | "Clean",
  "compilationIssues": [
    { "issue": "Short title", "severity": "error" | "warning" | "info", "description": "Detailed explanation" }
  ],
  "runtimeRisks": ["Risk 1", "Risk 2"],
  "memoryProblems": ["Memory issue 1", "Memory issue 2"],
  "concurrencyProblems": ["Concurrency issue 1", "Concurrency issue 2"],
  "securityIssues": ["Security issue 1", "Security issue 2"],
  "embeddedConcerns": {
    "memory": "Detailed evaluation of stack/heap/buffer safety",
    "concurrency": "ISR reentrancy, volatile correctness, locking analysis",
    "timing": "Watchdog, delay, deterministic execution impact",
    "errorHandling": "Hardware failure, bus lockup and recovery mechanisms"
  },
  "suggestedImprovements": ["Actionable improvement 1", "Actionable improvement 2"],
  "correctedCode": "The full corrected, robust, documented code snippet ready for compile",
  "detailedExplanation": "Complete markdown explanation walking through why changes were made"
}`;

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: EMBEDDED_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const rawText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback in case response has backticks
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ result: parsedData, verifiedUid });
  } catch (error: any) {
    console.error("Analyze API error:", error);
    const msg = error?.message || "";
    let userMsg = msg;
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
      userMsg = "The AI service is experiencing temporary peak demand. Please click Analyze Code again in a moment.";
    }
    return res.status(500).json({
      error: userMsg || "Failed to analyze code. Verify GEMINI_API_KEY."
    });
  }
});

// Vite middleware in dev mode or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EmbeddedAI Copilot] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
