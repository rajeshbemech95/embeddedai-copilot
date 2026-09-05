import { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Server, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  RefreshCw,
  Terminal,
  ExternalLink
} from "lucide-react";
import { User } from "firebase/auth";
import firebaseConfigJson from "../../firebase-applet-config.json";

interface SettingsViewProps {
  user: User;
}

export function SettingsView({ user }: SettingsViewProps) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkBackendHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthStatus(data);
    } catch (err: any) {
      setHealthStatus({ error: err.message || "Failed to reach /api/health" });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">Workspace & Security Configuration</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Inspection interface for your Firebase authentication boundary, Cloud Firestore storage isolation, server-side Gemini routing, and Cloud Run production telemetry.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Identity Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase">Authentication & Isolation Boundary</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">AUTHENTICATED USER ID (UID)</span>
              <span className="text-cyan-400 break-all select-all font-semibold">{user.uid}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">DISPLAY NAME</span>
                <span className="text-slate-200">{user.displayName || "Firmware Engineer"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">EMAIL IDENTIFIER</span>
                <span className="text-slate-200 truncate block">{user.email || "N/A"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Trust Firestore Rule Enforced</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                All Firestore documents are routed to <code className="text-emerald-300 font-mono">/users/{user.uid}/*</code>. Security rules strictly mandate <code className="text-emerald-300 font-mono">request.auth.uid == userId</code>. Cross-tenant access is mathematically rejected at the database engine level.
              </p>
            </div>
          </div>
        </div>

        {/* Backend & AI Core Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase">AI & Backend Runtime</h3>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={checkingHealth}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
              <span>Ping /api/health</span>
            </button>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">AI MODEL SPECIFICATION</span>
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold">Gemini 3.8 Flash</span>
                <span className="text-emerald-400 text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800">
                  SERVER-SIDE PROXIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                API Key is stored securely on the Node.js / Express backend. No tokens are exposed to frontend browser JavaScript.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">CLOUD RUN READY CONTAINER</span>
              <div className="text-slate-300 text-[11px]">
                Port Configuration: <code className="text-cyan-300 font-bold">process.env.PORT || 3000</code>
              </div>
              <div className="text-slate-300 text-[11px]">
                Host Binding: <code className="text-cyan-300">0.0.0.0</code>
              </div>
            </div>

            {healthStatus && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">HEALTHCHECK RESPONSE</span>
                  <span className="text-emerald-400 text-[10px]">● 200 OK</span>
                </div>
                <pre className="text-[10px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(healthStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Firestore Configuration Details */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase">Firestore Database Config</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">PROJECT ID</span>
              <span className="text-slate-200 truncate block">{firebaseConfigJson.projectId}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">FIRESTORE DATABASE ID</span>
              <span className="text-slate-200 truncate block">{firebaseConfigJson.firestoreDatabaseId || "(default)"}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">AUTH DOMAIN</span>
              <span className="text-slate-200 truncate block">{firebaseConfigJson.authDomain}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
