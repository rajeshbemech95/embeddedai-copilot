import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Cpu, 
  Terminal, 
  FolderKanban, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Copy,
  AlertCircle,
  Clock,
  Layers
} from "lucide-react";
import { Conversation, ChatMessage, EmbeddedProject } from "../types";
import { 
  createConversation, 
  deleteConversation, 
  subscribeToMessages, 
  addMessage 
} from "../lib/firestoreService";
import { User } from "firebase/auth";
import Markdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";

interface AIChatViewProps {
  user: User;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onConversationCreated: (conv: Conversation) => void;
  projects: EmbeddedProject[];
  activeProject?: EmbeddedProject | null;
}

const SAMPLE_EMBEDDED_PROMPTS = [
  "How to implement an I2C bus lockup recovery routine on ESP32?",
  "Show a thread-safe FreeRTOS UART circular buffer with ISR and Task notification.",
  "How to properly configure CAN-bus filter masks on STM32 using HAL?",
  "Write an embedded C ring buffer with atomic head/tail pointers.",
  "Best practices for BLE GATT server notification throughput optimization on nRF52."
];

export function AIChatView({
  user,
  conversations,
  activeConversation,
  onSelectConversation,
  onConversationCreated,
  projects,
  activeProject
}: AIChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.projectId || activeConversation?.projectId || ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(user.uid, activeConversation.conversationId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversation, user.uid]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleCreateNewConversation = async (title?: string) => {
    try {
      setErrorMessage(null);
      const newConv = await createConversation(
        user.uid, 
        title || "New Embedded Session", 
        selectedProjectId || undefined
      );
      onConversationCreated(newConv);
      onSelectConversation(newConv);
      return newConv;
    } catch (err: any) {
      console.error("Failed to create conversation:", err);
      setErrorMessage("Could not create conversation in Firestore. " + (err?.message || ""));
      return null;
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteConversation(user.uid, convId);
      if (activeConversation?.conversationId === convId) {
        const remaining = conversations.filter(c => c.conversationId !== convId);
        if (remaining.length > 0) {
          onSelectConversation(remaining[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    let targetConv = activeConversation;
    if (!targetConv) {
      // Derive title from prompt
      const autoTitle = text.slice(0, 45) + (text.length > 45 ? "..." : "");
      targetConv = await handleCreateNewConversation(autoTitle);
      if (!targetConv) return;
    }

    setInputText("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      // 1. Add user message to Firestore
      await addMessage(user.uid, targetConv.conversationId, "user", text);

      // 2. Prepare context
      const selectedProj = projects.find(p => p.projectId === selectedProjectId);
      const projectContext = selectedProj ? {
        projectName: selectedProj.projectName,
        technology: selectedProj.technology,
        targetChip: selectedProj.targetChip,
        description: selectedProj.description
      } : undefined;

      // History of messages including previous + new
      const historyPayload = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: text }
      ];

      // 3. Obtain fresh Firebase ID token
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required: Unable to acquire Firebase ID token. Please sign in again.");
      }

      // 4. Call protected backend Gemini endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          messages: historyPayload,
          projectContext
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error(errData.error || "Authentication error: Session expired or invalid. Please re-authenticate.");
        }
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "No response received from EmbeddedAI Copilot.";

      // 5. Add assistant response to Firestore
      await addMessage(user.uid, targetConv.conversationId, "assistant", reply);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMessage(err.message || "Failed to communicate with AI server.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
      {/* Left Sidebar: Saved Conversations */}
      <div className="w-full md:w-72 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col shrink-0 overflow-hidden">
        {/* Thread Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">Threads</span>
          </div>
          <button
            id="chat-new-thread-btn"
            onClick={() => handleCreateNewConversation()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Project Context selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1 flex items-center gap-1">
            <FolderKanban className="w-3 h-3 text-cyan-400" />
            <span>Hardware Context</span>
          </label>
          <select
            id="chat-project-context-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">None (Generic Embedded Systems)</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName} ({p.technology})
              </option>
            ))}
          </select>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              <p>No chat history yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Start a conversation below.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConversation?.conversationId === c.conversationId;
              return (
                <div
                  key={c.conversationId}
                  id={`chat-thread-${c.conversationId}`}
                  onClick={() => onSelectConversation(c)}
                  className={`
                    p-2.5 rounded-lg text-xs transition-all cursor-pointer group flex items-center justify-between gap-2
                    ${isActive 
                      ? "bg-cyan-950/60 border border-cyan-700/60 text-cyan-200" 
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"}
                  `}
                >
                  <div className="overflow-hidden flex-1">
                    <span className="truncate block font-medium font-sans">{c.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    id={`delete-conv-btn-${c.conversationId}`}
                    onClick={(e) => handleDeleteConversation(c.conversationId, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1 rounded transition-opacity"
                    title="Delete Thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {/* Chat Active Header */}
        <div className="h-14 px-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate font-sans">
                {activeConversation?.title || "New Embedded Session"}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {selectedProjectId 
                  ? `Context: ${projects.find(p => p.projectId === selectedProjectId)?.projectName}`
                  : "Senior Embedded C/C++, RTOS & IoT Architect"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400">
              Gemini 3 Flash
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                  if (lastUserMsg) {
                    handleSendMessage(lastUserMsg.content);
                  }
                }}
                className="px-2.5 py-1 rounded bg-red-900/70 hover:bg-red-800 text-white font-mono text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-base font-semibold text-white">EmbeddedAI Assistant Standing By</h4>
                <p className="text-xs text-slate-400">
                  Ask deep questions regarding register maps, ISR design, FreeRTOS synchronization, memory leaks, Linux kernel drivers, or bus timing.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full max-w-xl text-left space-y-2 pt-2">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Example Engineering Queries:</p>
                <div className="space-y-1.5">
                  {SAMPLE_EMBEDDED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-xs text-slate-300 hover:text-cyan-300 transition-all font-mono"
                    >
                      → {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.messageId}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                      <Cpu className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`
                    max-w-2xl rounded-xl p-4 text-xs leading-relaxed space-y-2
                    ${isUser 
                      ? "bg-cyan-950/70 border border-cyan-800/80 text-cyan-50" 
                      : "bg-slate-900/90 border border-slate-800 text-slate-200"}
                  `}>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-800/60 pb-1">
                      <span className="font-semibold text-slate-300">
                        {isUser ? "Engineer (You)" : "Principal Firmware Architect"}
                      </span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Markdown Body */}
                    <div className="prose prose-invert prose-xs max-w-none">
                      <Markdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isBlock = match || String(children).includes("\n");
                            if (isBlock) {
                              return (
                                <CodeBlock 
                                  code={String(children).replace(/\n$/, "")} 
                                  language={match ? match[1] : "c"} 
                                />
                              );
                            }
                            return (
                              <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {m.content}
                      </Markdown>
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1 text-xs font-mono">
                      ENG
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Synthesizing firmware response & memory impact...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              id="chat-input-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask an embedded systems question, paste a register dump, or debug an ISR... (Shift+Enter for newline)"
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
            <button
              type="submit"
              id="chat-send-btn"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98] disabled:opacity-40 cursor-pointer h-[42px] flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Conversations persisted in Cloud Firestore isolated by your UID</span>
            <span>Shift+Enter for newline • Markdown supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
