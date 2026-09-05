import { useState } from "react";
import { 
  Code2, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Zap, 
  Clock, 
  MemoryStick, 
  RefreshCw,
  Copy,
  Check,
  Flame,
  FileCode2,
  ListFilter
} from "lucide-react";
import { CodeAnalysisResult } from "../types";
import { CodeBlock } from "./CodeBlock";
import { User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface CodeAnalyzerViewProps {
  user?: User | null;
}

const PRESET_BUGGY_CODES = [
  {
    title: "ESP32 ISR Dynamic Allocation & Missing Volatile",
    platform: "ESP-IDF / FreeRTOS",
    language: "c",
    code: `// Buggy ESP32 Timer ISR Example
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int sensor_counter = 0; // NOT volatile!

void IRAM_ATTR timer_isr_handler(void* arg) {
    sensor_counter++; // Race condition with main task
    
    // CRITICAL BUG: malloc() / sprintf() inside ISR is NOT re-entrant!
    char* log_buf = (char*)malloc(64);
    if (log_buf) {
        sprintf(log_buf, "Event count: %d\\n", sensor_counter);
        // send over UART or queue...
        // Missing free(log_buf) -> memory leak every timer tick!
    }
}

void app_main(void) {
    while(1) {
        if (sensor_counter > 100) {
            printf("Threshold reached: %d\\n", sensor_counter);
            sensor_counter = 0; // Non-atomic clear
        }
    }
}`
  },
  {
    title: "FreeRTOS Priority Inversion & Unbounded Mutex Wait",
    platform: "FreeRTOS",
    language: "c",
    code: `// Buggy FreeRTOS Mutex & Watchdog starvation
#include "FreeRTOS.h"
#include "semphr.h"
#include "task.h"

SemaphoreHandle_t xBusMutex;

void LowPriorityLoggingTask(void* pvParameters) {
    while(1) {
        // Takes mutex without timeout check
        if (xSemaphoreTake(xBusMutex, portMAX_DELAY) == pdTRUE) {
            // Long blocking transmission without yielding
            vTaskDelay(pdMS_TO_TICKS(500)); 
            xSemaphoreGive(xBusMutex);
        }
    }
}

void HighPrioritySafetyTask(void* pvParameters) {
    while(1) {
        // High priority task gets blocked indefinitely by medium priority tasks
        // causing watchdog timeout and system reset!
        if (xSemaphoreTake(xBusMutex, portMAX_DELAY) == pdTRUE) {
            // Safety critical actuator trigger
            xSemaphoreGive(xBusMutex);
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}`
  },
  {
    title: "STM32 DMA UART Buffer Cache & Overflow Hazard",
    platform: "STM32 HAL / CMSIS",
    language: "c",
    code: `// STM32 HAL UART DMA Receive without cache invalidation or framing guard
#include "stm32f4xx_hal.h"

uint8_t rx_buffer[128];

void start_telemetry(UART_HandleTypeDef *huart) {
    // Starts DMA reception into local stack buffer or unaligned memory
    HAL_UART_Receive_DMA(huart, rx_buffer, sizeof(rx_buffer));
}

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
    // Unsafe string operation on raw binary stream
    char packet[256];
    strcpy(packet, (char*)rx_buffer); // Potential buffer overflow! Missing null terminator!
    
    // DMA buffer is re-armed without checking if previous frame was fully parsed
    HAL_UART_Receive_DMA(huart, rx_buffer, sizeof(rx_buffer));
}`
  },
  {
    title: "I2C Bus Lockup Without Software Reset Recovery",
    platform: "Generic Embedded C",
    language: "c",
    code: `// I2C Peripheral reading without bus timeout
#include <stdint.h>
#include <stdbool.h>

bool read_i2c_sensor(uint8_t dev_addr, uint8_t reg, uint8_t *data) {
    // Start condition
    I2C_GENERATE_START();
    
    // Wait for address ACK indefinitely -> HANGS if slave pulls SDA low!
    while (!I2C_CHECK_FLAG_ADDR()); 
    
    I2C_SEND_BYTE(dev_addr);
    while (!I2C_CHECK_FLAG_TXE()); // Infinite loop if bus hardware fails
    
    I2C_SEND_BYTE(reg);
    while (!I2C_CHECK_FLAG_TXE());
    
    *data = I2C_RECEIVE_BYTE();
    I2C_GENERATE_STOP();
    return true;
}`
  }
];

export function CodeAnalyzerView({ user }: CodeAnalyzerViewProps = {}) {
  const [code, setCode] = useState<string>(PRESET_BUGGY_CODES[0].code);
  const [platform, setPlatform] = useState<string>("ESP-IDF / FreeRTOS");
  const [language, setLanguage] = useState<string>("c");
  const [customContext, setCustomContext] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<CodeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "concerns" | "code" | "explanation">("summary");

  const handleRunAnalysis = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Obtain fresh Firebase ID token from authenticated user
      const currentUser = user || auth.currentUser;
      if (!currentUser) {
        throw new Error("Authentication required: Please sign in with Firebase to run firmware code analysis.");
      }

      const idToken = await currentUser.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required: Unable to acquire Firebase ID token. Please re-authenticate.");
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          code,
          language,
          targetPlatform: platform,
          customContext
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error(errData.error || "Authentication error: Session expired or invalid. Please sign in again.");
        }
        throw new Error(errData.error || `Analysis failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data.result);
      setActiveTab("summary");
    } catch (err: any) {
      console.error("Code analysis error:", err);
      setError(err.message || "Failed to analyze code.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadPreset = (preset: typeof PRESET_BUGGY_CODES[0]) => {
    setCode(preset.code);
    setPlatform(preset.platform);
    setLanguage(preset.language);
    setResult(null);
    setError(null);
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "Critical":
        return "bg-red-950/80 border-red-800 text-red-400";
      case "High":
        return "bg-amber-950/80 border-amber-800 text-amber-400";
      case "Medium":
        return "bg-yellow-950/80 border-yellow-800 text-yellow-300";
      default:
        return "bg-emerald-950/80 border-emerald-800 text-emerald-400";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">Firmware Code Analyzer</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Audit embedded routines against race conditions, volatile hazards, memory leaks, ISR stack depth, and watchdog hang risks.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <ListFilter className="w-3 h-3" /> Test Presets:
          </span>
          {PRESET_BUGGY_CODES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(preset)}
              className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              Preset #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Input & Platform Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">TARGET PLATFORM / RTOS</label>
                <select
                  id="analyzer-platform-select"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ESP-IDF / FreeRTOS">ESP-IDF (ESP32 / ESP32-S3)</option>
                  <option value="STM32 HAL / CMSIS">STM32 HAL / CMSIS (ARM Cortex-M)</option>
                  <option value="FreeRTOS (Generic)">FreeRTOS (Generic Microcontroller)</option>
                  <option value="Zephyr RTOS">Zephyr RTOS</option>
                  <option value="Embedded Linux / Kernel Driver">Embedded Linux / Kernel Driver</option>
                  <option value="Nordic nRF Connect SDK (BLE)">Nordic nRF52/nRF53 (BLE Stack)</option>
                  <option value="Bare-Metal ARM Cortex">Bare-Metal ARM Cortex-M</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">LANGUAGE</label>
                <select
                  id="analyzer-lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="c">Embedded C (C99 / C11)</option>
                  <option value="cpp">Embedded C++ (C++17 / C++20)</option>
                  <option value="rust">Embedded Rust (no_std)</option>
                  <option value="python">MicroPython / CircuitPython</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">ADDITIONAL CONTEXT (OPTIONAL)</label>
              <input
                id="analyzer-context-input"
                type="text"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="e.g. Running at 80MHz with 4KB stack; power budgeted for deep sleep"
                className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
                <span>PASTE SOURCE CODE:</span>
                <span>{code.split("\n").length} lines</span>
              </div>
              <textarea
                id="analyzer-code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                placeholder="Paste C, C++, or driver code here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 resize-none selection:bg-cyan-500/30"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setCode("")}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Buffer
              </button>

              <button
                id="analyzer-run-btn"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !code.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing Hardware Routine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Deep Analyzer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Output & Recommendations */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {!result && !isAnalyzing && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-semibold text-white font-mono">No Code Analysis Generated Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select one of the preset firmware bugs above or paste your custom MCU code, then click <strong className="text-emerald-400">Run Deep Analyzer</strong>.
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                <Cpu className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white font-mono">Analyzing Hardware & Concurrency Boundaries</h3>
                <p className="text-xs text-slate-400">
                  Checking volatile registers, ISR stack allocations, reentrancy hazards, and watchdog timeouts via Gemini 2.5 Flash...
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden space-y-4">
              {/* Result Summary Bar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${getRiskColor(result.riskLevel)}`}>
                    RISK LEVEL: {result.riskLevel.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Gemini Firmware Auditor
                </span>
              </div>

              {/* Executive Summary */}
              <div className="px-4 text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/40 p-3 mx-4 rounded-lg border border-slate-800/80">
                <strong className="text-white block font-mono mb-1">Executive Summary:</strong>
                {result.summary}
              </div>

              {/* Navigation Tabs */}
              <div className="px-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
                <button
                  id="tab-btn-summary"
                  onClick={() => setActiveTab("summary")}
                  className={`pb-2.5 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === "summary"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Problems & Risks
                </button>
                <button
                  id="tab-btn-concerns"
                  onClick={() => setActiveTab("concerns")}
                  className={`pb-2.5 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === "concerns"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Embedded Concerns
                </button>
                <button
                  id="tab-btn-code"
                  onClick={() => setActiveTab("code")}
                  className={`pb-2.5 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === "code"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Corrected Code
                </button>
                <button
                  id="tab-btn-explanation"
                  onClick={() => setActiveTab("explanation")}
                  className={`pb-2.5 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === "explanation"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Root Cause Breakdown
                </button>
              </div>

              {/* Tab 1: Problems & Risks */}
              {activeTab === "summary" && (
                <div className="p-4 space-y-4 text-xs font-mono">
                  {/* Compilation Issues */}
                  {result.compilationIssues && result.compilationIssues.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 block font-bold uppercase text-[11px]">Compilation Issues:</span>
                      {result.compilationIssues.map((item, i) => (
                        <div key={i} className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-300">{item.issue}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                              {item.severity}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-sans">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Runtime Risks */}
                  {result.runtimeRisks && result.runtimeRisks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 block font-bold uppercase text-[11px]">Runtime Risks:</span>
                      <ul className="space-y-1 text-slate-300">
                        {result.runtimeRisks.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Memory & Concurrency Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-cyan-400 font-bold block flex items-center gap-1.5">
                        <MemoryStick className="w-3.5 h-3.5" /> Memory Problems
                      </span>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {result.memoryProblems?.map((m, i) => (
                          <li key={i}>• {m}</li>
                        )) || <li>No severe heap/stack leaks flagged</li>}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-purple-400 font-bold block flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Concurrency & ISR Hazards
                      </span>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {result.concurrencyProblems?.map((c, i) => (
                          <li key={i}>• {c}</li>
                        )) || <li>No race conditions detected</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Embedded-Specific Concerns */}
              {activeTab === "concerns" && (
                <div className="p-4 space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold block">1. Memory & Stack Budgeting:</span>
                    <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                      {result.embeddedConcerns?.memory || "Memory usage within nominal boundaries."}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold block">2. Concurrency, Volatile & ISR Reentrancy:</span>
                    <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                      {result.embeddedConcerns?.concurrency || "Locking primitives validated."}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold block">3. Deterministic Timing & Watchdog (WDT):</span>
                    <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                      {result.embeddedConcerns?.timing || "No unconstrained blocking delays detected."}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold block">4. Hardware Error Handling & Bus Recovery:</span>
                    <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                      {result.embeddedConcerns?.errorHandling || "Peripheral timeouts configured."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Corrected Code */}
              {activeTab === "code" && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Production-Ready Remediated Firmware
                    </span>
                  </div>
                  <CodeBlock 
                    code={result.correctedCode || "// No corrected code provided"} 
                    language={language}
                    filename={`corrected_${platform.replace(/\s+/g, "_").toLowerCase()}.${language}`}
                  />
                </div>
              )}

              {/* Tab 4: Detailed Root Cause Explanation */}
              {activeTab === "explanation" && (
                <div className="p-4 space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="font-mono font-bold text-white text-sm">Detailed Engineering Analysis</h4>
                    <p className="whitespace-pre-wrap font-sans text-slate-300 text-xs">
                      {result.detailedExplanation || "Refer to the problems and embedded concerns tabs for root cause specifics."}
                    </p>
                  </div>

                  {result.suggestedImprovements && (
                    <div className="space-y-1.5">
                      <span className="font-mono font-bold text-slate-400 uppercase text-[11px]">Recommended Engineering Improvements:</span>
                      <ul className="space-y-1">
                        {result.suggestedImprovements.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800 text-slate-300 text-xs font-mono">
                            <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
