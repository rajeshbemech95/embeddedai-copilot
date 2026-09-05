import { useState, useEffect } from "react";
import { auth, onAuthStateChanged, User, logOut, testFirestoreConnection } from "./lib/firebase";
import { syncUserProfile, subscribeToProjects, subscribeToConversations } from "./lib/firestoreService";
import { EmbeddedProject, Conversation, NavigationTab } from "./types";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { DashboardOverview } from "./components/DashboardOverview";
import { AIChatView } from "./components/AIChatView";
import { CodeAnalyzerView } from "./components/CodeAnalyzerView";
import { ProjectsView } from "./components/ProjectsView";
import { HistoryView } from "./components/HistoryView";
import { SettingsView } from "./components/SettingsView";
import { Menu, Cpu } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<NavigationTab>("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Firestore persistent state
  const [projects, setProjects] = useState<EmbeddedProject[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Selection state
  const [activeProject, setActiveProject] = useState<EmbeddedProject | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Listen to Auth State
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync profile record in /users/{userId}
        await syncUserProfile(user).catch((e) => console.error("Sync profile error:", e));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's Projects & Conversations in Firestore
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setConversations([]);
      setActiveProject(null);
      setActiveConversation(null);
      return;
    }

    const unsubProjects = subscribeToProjects(currentUser.uid, (pList) => {
      setProjects(pList);
    });

    const unsubConvs = subscribeToConversations(currentUser.uid, (cList) => {
      setConversations(cList);
      // If active conversation not set or deleted, select first available
      if (cList.length > 0 && !activeConversation) {
        setActiveConversation(cList[0]);
      }
    });

    return () => {
      unsubProjects();
      unsubConvs();
    };
  }, [currentUser]);

  const handleSignOut = async () => {
    await logOut();
    setCurrentTab("dashboard");
  };

  const handleSelectProjectForChat = (project: EmbeddedProject) => {
    setActiveProject(project);
    setCurrentTab("chat");
  };

  const handleSelectProjectForAnalyzer = (project: EmbeddedProject) => {
    setActiveProject(project);
    setCurrentTab("analyzer");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-mono text-xs gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Cpu className="w-5 h-5 animate-spin" />
        </div>
        <span>Initializing EmbeddedAI Security Boundary...</span>
      </div>
    );
  }

  // Unauthenticated user -> Landing Page
  if (!currentUser) {
    return <LandingPage onSignedIn={() => setCurrentTab("dashboard")} />;
  }

  // Authenticated user -> Engineering Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={currentUser}
        onSignOut={handleSignOut}
        isOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        activeProject={activeProject}
        onClearActiveProject={() => setActiveProject(null)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="mobile-nav-toggle-btn"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-sm text-white">EmbeddedAI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              {currentTab.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === "dashboard" && (
            <DashboardOverview
              user={currentUser}
              projects={projects}
              conversations={conversations}
              onNavigate={setCurrentTab}
              onSelectProject={handleSelectProjectForChat}
              onSelectConversation={(conv) => {
                setActiveConversation(conv);
                setCurrentTab("chat");
              }}
              onNewProject={() => setCurrentTab("projects")}
              onNewChat={() => {
                setActiveConversation(null);
                setCurrentTab("chat");
              }}
            />
          )}

          {currentTab === "chat" && (
            <AIChatView
              user={currentUser}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
              onConversationCreated={setActiveConversation}
              projects={projects}
              activeProject={activeProject}
            />
          )}

          {currentTab === "analyzer" && (
            <CodeAnalyzerView user={currentUser} />
          )}

          {currentTab === "projects" && (
            <ProjectsView
              user={currentUser}
              projects={projects}
              onSelectProjectForChat={handleSelectProjectForChat}
              onSelectProjectForAnalyzer={handleSelectProjectForAnalyzer}
            />
          )}

          {currentTab === "history" && (
            <HistoryView
              user={currentUser}
              conversations={conversations}
              projects={projects}
              onSelectConversation={(conv) => {
                setActiveConversation(conv);
                setCurrentTab("chat");
              }}
              onSelectProject={(proj) => {
                setActiveProject(proj);
                setCurrentTab("projects");
              }}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView user={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}
