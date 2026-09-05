import { useState } from "react";
import { 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Radio, 
  Activity, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Database,
  Server
} from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";

interface LandingPageProps {
  onSignedIn: () => void;
}

export function LandingPage({ onSignedIn }: LandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onSignedIn();
    } catch (err: any) {
      console.error("Sign in failed:", err);
      // Helpful error message for popup or user cancel
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup closed. Please try again to authenticate.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by the browser. Please allow popups for this domain.");
      } else {
        setError(err?.message || "Authentication failed. Please verify network access.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">EmbeddedAI</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300 font-mono">COPILOT</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">Firmware & IoT Engineering Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="landing-signin-btn-top"
              onClick={handleSignIn}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.815.54 3.86 1.43l2.36-2.36C17.06 3.65 14.77 3 12.24 3 7.27 3 3.24 7.03 3.24 12s4.03 9 9 9c4.985 0 9-3.765 9-9 0-.61-.065-1.205-.185-1.715h-8.815z"/>
                </svg>
              )}
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Core Value & Sign-in */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Powered by Gemini 2.5 Flash Server-Side Core</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Senior Embedded & IoT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Firmware Intelligence</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                EmbeddedAI Copilot is an authenticated engineering assistant designed specifically for hardware engineers, firmware developers, and IoT architects. Troubleshoot ISR race conditions, diagnose memory leaks, recover locked I2C/SPI buses, and optimize FreeRTOS/Zephyr pipelines with multi-turn conversations and automated code audits.
              </p>

              {/* Error banner if any */}
              {error && (
                <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Box */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 max-w-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Firebase Zero-Trust Authentication
                  </span>
                  <span>Google Sign-In</span>
                </div>

                <button
                  id="landing-signin-btn-main"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all shadow-lg shadow-cyan-600/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.815.54 3.86 1.43l2.36-2.36C17.06 3.65 14.77 3 12.24 3 7.27 3 3.24 7.03 3.24 12s4.03 9 9 9c4.985 0 9-3.765 9-9 0-.61-.065-1.205-.185-1.715h-8.815z"/>
                    </svg>
                  )}
                  <span className="text-base">Enter Engineering Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  Strictly isolated by your Firebase UID. All projects and conversation history are encrypted in Cloud Firestore.
                </p>
              </div>

              {/* Supported hardware chips & protocols pills */}
              <div className="pt-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">Supported Architectures & Protocols</p>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {["ESP32 / ESP8266", "ARM Cortex-M", "Embedded Linux", "FreeRTOS", "Zephyr RTOS", "UART / SPI / I2C", "CAN / CAN-FD", "BLE / Wi-Fi", "MQTT"].map((item) => (
                    <span key={item} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Technical Preview Mockup */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden font-mono text-xs">
                {/* Terminal Header */}
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    <span className="text-slate-300 ml-2 font-medium">copilot@embedded-core:~</span>
                  </div>
                  <span className="text-[10px] text-cyan-400">ARM Cortex-M4 / FreeRTOS</span>
                </div>

                {/* Simulated Analysis */}
                <div className="p-4 space-y-3 bg-slate-950/60">
                  <div className="text-slate-400">
                    <span className="text-cyan-400">$</span> embedded-ai analyze --file i2c_driver.c
                  </div>

                  <div className="p-3 rounded bg-red-950/30 border border-red-900/50 space-y-1">
                    <div className="text-red-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      CRITICAL: Non-Atomic Mutex In ISR & Missing Timeout
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Line 42 attempts <code className="text-amber-300">xSemaphoreTake()</code> with blocking delay inside ISR. This causes hard fault on ARM Cortex-M.
                    </p>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Remediated Code Generated
                    </div>
                    <pre className="text-[10.5px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/80 overflow-x-auto">
{`BaseType_t xHigherPriorityTaskWoken = pdFALSE;
xSemaphoreGiveFromISR(xI2cSem, &xHigherPriorityTaskWoken);
portYIELD_FROM_ISR(xHigherPriorityTaskWoken);`}
                    </pre>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Activity className="w-3.5 h-3.5" /> Stack: 128B | Reentrant: YES
                    </span>
                    <span className="text-slate-400">Latency: deterministic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Multi-Turn AI Chat</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Converse with an AI persona steeped in RTOS task scheduling, DMA registers, bitmask manipulation, and wireless stacks. Context persists across sessions in Cloud Firestore.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Deep Firmware Code Analyzer</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Examine raw C/C++ or driver code for race conditions, stack leaks, unhandled bus hangs, priority inversions, and volatile mistakes before flashing hardware.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Hardware Project Registry</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Organize firmware repositories by target chip (ESP32, STM32, nRF52, i.MX). Link active chat sessions directly to project context for tailored assistance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>EmbeddedAI Copilot • Cloud Run & Firebase Firestore Verified</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Zero-Trust Auth Isolated</span>
            <span>•</span>
            <span>Gemini 2.5 Flash Server-Side</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
