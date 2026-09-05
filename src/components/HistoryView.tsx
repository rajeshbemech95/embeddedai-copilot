import { useState } from "react";
import { 
  History, 
  MessageSquare, 
  FolderKanban, 
  Search, 
  Calendar, 
  ArrowRight, 
  Trash2,
  Cpu,
  Layers
} from "lucide-react";
import { Conversation, EmbeddedProject } from "../types";
import { deleteConversation } from "../lib/firestoreService";
import { User } from "firebase/auth";

interface HistoryViewProps {
  user: User;
  conversations: Conversation[];
  projects: EmbeddedProject[];
  onSelectConversation: (conv: Conversation) => void;
  onSelectProject: (proj: EmbeddedProject) => void;
}

export function HistoryView({
  user,
  conversations,
  projects,
  onSelectConversation,
  onSelectProject
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "conversations" | "projects">("all");

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.technology.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConv = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteConversation(user.uid, convId);
    } catch (err: any) {
      console.error("Failed to delete conversation:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">Workspace History & Audit Log</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Unified record of your past technical consultations, firmware architecture threads, and hardware project registrations.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="history-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded ${filterType === "all" ? "bg-slate-800 text-cyan-300 font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("conversations")}
              className={`px-2.5 py-1 rounded ${filterType === "conversations" ? "bg-slate-800 text-cyan-300 font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              Chats
            </button>
            <button
              onClick={() => setFilterType("projects")}
              className={`px-2.5 py-1 rounded ${filterType === "projects" ? "bg-slate-800 text-cyan-300 font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {/* Conversations */}
        {(filterType === "all" || filterType === "conversations") && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Chat Conversations ({filteredConversations.length})</span>
            </h3>

            {filteredConversations.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono italic pl-2">No conversations match criteria.</p>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.conversationId}
                  id={`history-conv-${c.conversationId}`}
                  onClick={() => onSelectConversation(c)}
                  className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {c.title}
                      </span>
                      {c.projectId && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                          Linked to Project
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate font-mono text-[11px]">
                      {c.lastMessage || "Multi-turn consultation thread"}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                      <span>• Updated {new Date(c.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`delete-history-conv-${c.conversationId}`}
                      onClick={(e) => handleDeleteConv(c.conversationId, e)}
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Projects */}
        {(filterType === "all" || filterType === "projects") && (
          <div className="space-y-2 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
              <span>Registered Projects ({filteredProjects.length})</span>
            </h3>

            {filteredProjects.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono italic pl-2">No projects match criteria.</p>
            ) : (
              filteredProjects.map((p) => (
                <div
                  key={p.projectId}
                  id={`history-proj-${p.projectId}`}
                  onClick={() => onSelectProject(p)}
                  className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                        {p.projectName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-400 font-mono">
                        {p.technology}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        {p.targetChip || "Generic"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {p.description || "No description"}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      ID: {p.projectId} • Last updated {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
