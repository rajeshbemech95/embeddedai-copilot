export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmbeddedProject {
  projectId: string;
  ownerUID: string;
  projectName: string;
  description: string;
  technology: string;
  targetChip?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  conversationId: string;
  userId: string;
  title: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface CodeAnalysisResult {
  summary: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Clean';
  compilationIssues: Array<{
    issue: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
  }>;
  runtimeRisks: string[];
  memoryProblems: string[];
  concurrencyProblems: string[];
  securityIssues: string[];
  embeddedConcerns: {
    memory: string;
    concurrency: string;
    timing: string;
    errorHandling: string;
  };
  suggestedImprovements: string[];
  correctedCode: string;
  detailedExplanation?: string;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'chat' 
  | 'analyzer' 
  | 'projects' 
  | 'history' 
  | 'settings';
