export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
  size: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AuditContextState {
  file: UploadedFile | null;
  analysisResult: string | null;
  status: AnalysisStatus;
}
