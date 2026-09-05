import { 
  Cpu, 
  MessageSquare, 
  Code2, 
  FolderKanban, 
  ArrowRight, 
  Activity, 
  Sparkles, 
  Zap, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Layers,
  FileCode2
} from "lucide-react";
import { EmbeddedProject, Conversation, NavigationTab } from "../types";
import { User } from "firebase/auth";

interface DashboardOverviewProps {
  user: User;
  projects: EmbeddedProject[];
  conversations: Conversation[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectProject: (project: EmbeddedProject) => void;
  onSelectConversation: (conv: Conversation) => void;
  onNewProject: () => void;
  onNewChat: () => void;
}

export function DashboardOverview({
  user,
  projects,
  conversations,
  onNavigate,
  onSelectProject,
  onSelectConversation,
  onNewProject,
  onNewChat
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Core Ready • ESP32 / ARM / Linux Spec
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user.displayName ? user.displayName.split(" ")[0] : "Engineer"}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Your isolated embedded engineering workspace is active. Analyze firmware routines, audit concurrency risks, review pinout schematics, or troubleshoot driver bugs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-quick-chat-btn"
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start AI Chat</span>
            </button>
            <button
              id="dash-quick-analyze-btn"
              onClick={() => onNavigate("analyzer")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Analyze Code</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[11px]">PROJECTS</span>
            <span className="text-lg font-bold text-white">{projects.length} Registered</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">CONVERSATIONS</span>
            <span className="text-lg font-bold text-white">{conversations.length} Saved</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">AI CORE</span>
            <span className="text-lg font-bold text-cyan-400">Gemini 2.5 Flash</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">PERSISTENCE</span>
            <span className="text-lg font-bold text-emerald-400">Cloud Firestore</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Projects & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Hardware & Firmware Projects</h3>
            </div>
            <button
              id="dash-new-project-btn"
              onClick={onNewProject}
              className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 space-y-3">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No embedded projects created yet.</p>
              <button
                onClick={onNewProject}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono transition-colors"
              >
                + Register First Project (e.g. ESP32 IoT Monitor)
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.projectId}
                  id={`dash-project-${p.projectId}`}
                  onClick={() => onSelectProject(p)}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {p.projectName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                        {p.technology}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {p.description || "No description provided"}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Target: {p.targetChip || "Generic"} • Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
                </div>
              ))}

              {projects.length > 4 && (
                <button
                  onClick={() => onNavigate("projects")}
                  className="w-full text-center py-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  View all {projects.length} projects →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Recent AI Conversations</h3>
            </div>
            <button
              id="dash-view-all-chats-btn"
              onClick={() => onNavigate("chat")}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Open Chat View →
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No saved conversations yet.</p>
              <button
                onClick={onNewChat}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono transition-colors"
              >
                + Ask Embedded Question
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {conversations.slice(0, 4).map((c) => (
                <div
                  key={c.conversationId}
                  id={`dash-conv-${c.conversationId}`}
                  onClick={() => onSelectConversation(c)}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate block">
                      {c.title}
                    </span>
                    <p className="text-xs text-slate-400 line-clamp-1 font-mono text-[11px]">
                      {c.lastMessage ? c.lastMessage : "Multi-turn session"}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                      {c.projectId && (
                        <span className="text-cyan-400">• Project Linked</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 mt-1" />
                </div>
              ))}

              {conversations.length > 4 && (
                <button
                  onClick={() => onNavigate("chat")}
                  className="w-full text-center py-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  View all {conversations.length} conversations →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Engineering Quick Reference */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Embedded Engineering Quick Reference</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-cyan-400 font-bold block">ESP32 Boot Strapping</span>
            <p className="text-slate-400 text-[11px]">
              GPIO0 must be LOW during reset to enter UART download bootloader mode; HIGH for normal SPI flash boot. Avoid floating GPIO12.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold block">FreeRTOS Stack Math</span>
            <p className="text-slate-400 text-[11px]">
              <code className="text-slate-300">usStackDepth</code> is in WORDS (4 bytes on 32-bit ARM/ESP32), not bytes. Always budget 2KB+ for printf/snprintf.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-purple-400 font-bold block">CAN-bus Termination</span>
            <p className="text-slate-400 text-[11px]">
              Ensure 120Ω terminating resistors at the two furthest ends of the CAN bus (60Ω equivalent differential impedance between CAN_H & CAN_L).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold block">I2C Bus Recovery</span>
            <p className="text-slate-400 text-[11px]">
              If slave locks SDA low, toggle SCL 9 clock pulses in software GPIO mode until SDA is released, then emit STOP condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
