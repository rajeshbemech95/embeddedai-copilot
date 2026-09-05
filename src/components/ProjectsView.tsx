import { useState } from "react";
import { 
  FolderKanban, 
  Plus, 
  Cpu, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Code2, 
  Calendar, 
  Check, 
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { EmbeddedProject } from "../types";
import { createProject, updateProject, deleteProject } from "../lib/firestoreService";
import { User } from "firebase/auth";

interface ProjectsViewProps {
  user: User;
  projects: EmbeddedProject[];
  onSelectProjectForChat: (project: EmbeddedProject) => void;
  onSelectProjectForAnalyzer: (project: EmbeddedProject) => void;
}

const COMMON_PROJECT_TEMPLATES = [
  {
    name: "ESP32 IoT Monitor",
    technology: "ESP-IDF / FreeRTOS",
    targetChip: "ESP32-S3",
    description: "Multi-sensor industrial telemetry monitoring environment with Wi-Fi, MQTT TLS 1.3, and Deep Sleep scheduling."
  },
  {
    name: "MQTT Gateway",
    technology: "Embedded Linux / C++",
    targetChip: "ARM Cortex-A53 / i.MX8",
    description: "Edge protocol translation bridge converting RS485 / Modbus RTU telemetry into secure cloud MQTT JSON payloads."
  },
  {
    name: "Embedded Linux Network Manager",
    technology: "Embedded Linux & Systemd",
    targetChip: "Allwinner H616",
    description: "Custom Linux daemon handling Ethernet failover, Wi-Fi Station/AP switching, and Cellular LTE modem AT-commands."
  },
  {
    name: "BLE GATT Server",
    technology: "Zephyr RTOS / Nordic SDK",
    targetChip: "nRF52840",
    description: "Low-energy peripheral providing Custom Environmental Sensing GATT Service, 2M PHY throughput, and AES-CCM encrypted pairing."
  }
];

export function ProjectsView({
  user,
  projects,
  onSelectProjectForChat,
  onSelectProjectForAnalyzer
}: ProjectsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<EmbeddedProject | null>(null);

  // Form state
  const [projectName, setProjectName] = useState("");
  const [technology, setTechnology] = useState("ESP-IDF / FreeRTOS");
  const [targetChip, setTargetChip] = useState("ESP32-S3");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openNewProjectModal = () => {
    setEditingProject(null);
    setProjectName("");
    setTechnology("ESP-IDF / FreeRTOS");
    setTargetChip("ESP32-S3");
    setDescription("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (proj: EmbeddedProject) => {
    setEditingProject(proj);
    setProjectName(proj.projectName);
    setTechnology(proj.technology);
    setTargetChip(proj.targetChip || "Generic");
    setDescription(proj.description);
    setFormError(null);
    setIsModalOpen(true);
  };

  const applyTemplate = (tpl: typeof COMMON_PROJECT_TEMPLATES[0]) => {
    setProjectName(tpl.name);
    setTechnology(tpl.technology);
    setTargetChip(tpl.targetChip);
    setDescription(tpl.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setFormError("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingProject) {
        await updateProject(user.uid, editingProject.projectId, {
          projectName: projectName.trim(),
          technology: technology.trim(),
          targetChip: targetChip.trim(),
          description: description.trim()
        });
      } else {
        await createProject(user.uid, {
          projectName: projectName.trim(),
          technology: technology.trim(),
          targetChip: targetChip.trim(),
          description: description.trim()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save project error:", err);
      setFormError(err.message || "Failed to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this embedded project?")) return;
    try {
      await deleteProject(user.uid, projectId);
    } catch (err: any) {
      console.error("Delete project error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">Hardware & Firmware Projects</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Register and manage your microcontroller targets, RTOS environments, and wireless protocol stacks. Securely stored in Firestore isolated by your UID.
          </p>
        </div>

        <button
          id="projects-create-new-btn"
          onClick={openNewProjectModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-md shadow-cyan-600/20 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">No Projects Registered Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create an embedded project (such as an ESP32 IoT Monitor or BLE GATT Server) to provide targeted architectural context to Gemini.
            </p>
          </div>
          <button
            onClick={openNewProjectModal}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono transition-colors"
          >
            + Register First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.projectId}
              id={`project-card-${proj.projectId}`}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {proj.projectName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                        {proj.technology}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        {proj.targetChip || "Generic MCU"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`edit-proj-btn-${proj.projectId}`}
                      onClick={() => openEditModal(proj)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Edit Project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-proj-btn-${proj.projectId}`}
                      onClick={() => handleDelete(proj.projectId)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-950/30 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {proj.description || "No architecture description provided."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500">
                  {new Date(proj.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    id={`chat-context-btn-${proj.projectId}`}
                    onClick={() => onSelectProjectForChat(proj)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-slate-800"
                    title="Start Chat with this Project context"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI Chat</span>
                  </button>
                  <button
                    id={`analyze-context-btn-${proj.projectId}`}
                    onClick={() => onSelectProjectForAnalyzer(proj)}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors py-1 px-2 rounded hover:bg-slate-800"
                    title="Analyze code with this platform"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Analyze</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  {editingProject ? "Edit Project Metadata" : "Register Embedded Project"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Quick Selection if creating */}
            {!editingProject && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">
                  Quick Load Architecture Template:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_PROJECT_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-left p-2 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all truncate"
                    >
                      • {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">PROJECT NAME *</label>
                <input
                  id="modal-project-name"
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. ESP32 IoT Monitor"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">CORE TECHNOLOGY *</label>
                  <input
                    id="modal-project-tech"
                    type="text"
                    required
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    placeholder="e.g. ESP-IDF / FreeRTOS"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">TARGET CHIP / MCU</label>
                  <input
                    id="modal-project-chip"
                    type="text"
                    value={targetChip}
                    onChange={(e) => setTargetChip(e.target.value)}
                    placeholder="e.g. ESP32-S3, STM32F4, nRF52840"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">DESCRIPTION & ARCHITECTURE</label>
                <textarea
                  id="modal-project-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe peripherals, bus protocols (SPI/I2C/CAN), RTOS task priorities, or power constraints..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-save-project-btn"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? "Saving to Firestore..." : editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
