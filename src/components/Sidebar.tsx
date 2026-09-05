import { 
  LayoutDashboard, 
  MessageSquare, 
  Code2, 
  FolderKanban, 
  History, 
  Settings, 
  LogOut, 
  Cpu, 
  X,
  User as UserIcon
} from "lucide-react";
import { NavigationTab, EmbeddedProject } from "../types";
import { User } from "firebase/auth";

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: User;
  onSignOut: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  activeProject?: EmbeddedProject | null;
  onClearActiveProject?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  user,
  onSignOut,
  isOpen,
  onCloseMobile,
  activeProject,
  onClearActiveProject
}: SidebarProps) {
  const navItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "analyzer", label: "Code Analyzer", icon: Code2 },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-950 border-r border-slate-800/80
        flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Top Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                  EmbeddedAI
                  <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">COPILOT</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">v1.0 • Embedded C/Linux</div>
              </div>
            </div>

            <button 
              id="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Project Filter if set */}
          {activeProject && (
            <div className="p-3 m-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-xs font-mono">
              <div className="truncate mr-2">
                <span className="text-[10px] text-cyan-400 block uppercase font-sans">Active Context:</span>
                <span className="text-cyan-200 font-semibold truncate block">{activeProject.projectName}</span>
              </div>
              <button
                id="clear-active-proj-btn"
                onClick={onClearActiveProject}
                className="text-slate-400 hover:text-cyan-300 p-1 rounded text-xs"
                title="Clear project focus"
              >
                ✕
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium font-mono transition-all text-left cursor-pointer
                    ${isActive 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-xs" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 mb-2">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="overflow-hidden flex-1 text-left">
              <p className="text-xs font-medium text-slate-200 truncate">{user.displayName || "Firmware Engineer"}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.email || user.uid.substring(0, 12)}</p>
            </div>
          </div>

          <button
            id="sidebar-signout-btn"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium font-mono text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
