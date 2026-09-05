import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./firebase";
import { EmbeddedProject, Conversation, ChatMessage, UserProfile } from "../types";
import { User } from "firebase/auth";

/**
 * Utility to strip undefined properties from an object before saving to Firestore.
 * Firestore throws a runtime error if any property value is undefined.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// Synchronize User profile
export async function syncUserProfile(user: User): Promise<void> {
  if (!user.uid) return;
  const userRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();
  
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const profile: Record<string, any> = cleanFirestoreData({
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: now,
      updatedAt: now
    });
    await setDoc(userRef, profile);
  } else {
    await setDoc(userRef, cleanFirestoreData({
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: now
    }), { merge: true });
  }
}

// ==================== PROJECTS ====================

export function subscribeToProjects(userId: string, callback: (projects: EmbeddedProject[]) => void) {
  const projectsCol = collection(db, "users", userId, "projects");
  const q = query(projectsCol, orderBy("updatedAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const projects: EmbeddedProject[] = [];
    snapshot.forEach((d) => {
      projects.push(d.data() as EmbeddedProject);
    });
    callback(projects);
  }, (err) => {
    console.error("Error subscribing to projects:", err);
    callback([]);
  });
}

export async function createProject(
  userId: string, 
  data: { projectName: string; description: string; technology: string; targetChip?: string }
): Promise<EmbeddedProject> {
  const projectId = "proj_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
  const projectRef = doc(db, "users", userId, "projects", projectId);
  const now = new Date().toISOString();

  const newProject: EmbeddedProject = {
    projectId,
    ownerUID: userId,
    projectName: data.projectName.trim(),
    description: data.description.trim(),
    technology: data.technology.trim(),
    targetChip: data.targetChip?.trim() || "Generic",
    createdAt: now,
    updatedAt: now
  };

  await setDoc(projectRef, cleanFirestoreData(newProject));
  return newProject;
}

export async function updateProject(
  userId: string, 
  projectId: string, 
  data: Partial<EmbeddedProject>
): Promise<void> {
  const projectRef = doc(db, "users", userId, "projects", projectId);
  await setDoc(projectRef, cleanFirestoreData({
    ...data,
    updatedAt: new Date().toISOString()
  }), { merge: true });
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const projectRef = doc(db, "users", userId, "projects", projectId);
  await deleteDoc(projectRef);
}

// ==================== CONVERSATIONS ====================

export function subscribeToConversations(userId: string, callback: (convs: Conversation[]) => void) {
  const convsCol = collection(db, "users", userId, "conversations");
  const q = query(convsCol, orderBy("updatedAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const convs: Conversation[] = [];
    snapshot.forEach((d) => {
      convs.push(d.data() as Conversation);
    });
    callback(convs);
  }, (err) => {
    console.error("Error subscribing to conversations:", err);
    callback([]);
  });
}

export async function createConversation(
  userId: string, 
  title: string, 
  projectId?: string
): Promise<Conversation> {
  const conversationId = "conv_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  const now = new Date().toISOString();

  const newConv: Conversation = {
    conversationId,
    userId,
    title: title.trim() || "New Embedded Session",
    createdAt: now,
    updatedAt: now
  };

  if (projectId && projectId.trim().length > 0) {
    newConv.projectId = projectId.trim();
  }

  await setDoc(convRef, cleanFirestoreData(newConv));
  return newConv;
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await deleteDoc(convRef);
}

// ==================== MESSAGES ====================

export function subscribeToMessages(
  userId: string, 
  conversationId: string, 
  callback: (messages: ChatMessage[]) => void
) {
  const msgsCol = collection(db, "users", userId, "conversations", conversationId, "messages");
  const q = query(msgsCol, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = [];
    snapshot.forEach((d) => {
      msgs.push(d.data() as ChatMessage);
    });
    callback(msgs);
  }, (err) => {
    console.error("Error subscribing to messages:", err);
    callback([]);
  });
}

export async function addMessage(
  userId: string, 
  conversationId: string, 
  role: 'user' | 'assistant' | 'system', 
  content: string
): Promise<ChatMessage> {
  const messageId = "msg_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
  const msgRef = doc(db, "users", userId, "conversations", conversationId, "messages", messageId);
  const now = new Date().toISOString();

  const msg: ChatMessage = {
    messageId,
    conversationId,
    userId,
    role,
    content,
    timestamp: now
  };

  await setDoc(msgRef, cleanFirestoreData(msg));

  // Update conversation updatedAt & lastMessage
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await setDoc(convRef, cleanFirestoreData({
    updatedAt: now,
    lastMessage: content ? content.slice(0, 100) : ""
  }), { merge: true });

  return msg;
}
