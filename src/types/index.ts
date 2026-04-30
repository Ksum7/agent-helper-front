export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
}

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  sessionId: string;
  userId: string;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  filename: string;
  mimeType: string;
  minioKey: string;
  qdrantId: string | null;
  sessionId: string | null;
  userId: string;
  createdAt: string;
}

export type ToolName =
  | 'search_user_files'
  | 'search_web'
  | 'browse_url'
  | 'execute_code'
  | 'remember_info'
  | 'recall_info'
  | 'forget_info';

export type StreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: ToolName | string; args?: unknown; id?: string }
  | { type: 'tool_result'; name: ToolName | string; content: string }
  | { type: 'message'; content: string }
  | { type: 'error'; content: string };

export interface ToolCallState {
  id: string;
  name: ToolName | string;
  args?: unknown;
  result?: string;
  done: boolean;
}

export interface StreamingState {
  thinking: string;
  content: string;
  tools: ToolCallState[];
  isStreaming: boolean;
  error: string | null;
}
