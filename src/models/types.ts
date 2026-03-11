// ─── Completion Status ───

export enum CompletionStatus {
  Cancelled = 1,
  NotWorthCost = 2,
  Replaced = 3,
  DoneAverage = 4,
  DoneGreat = 5,
}

// ─── Data Models ───

export interface Idea {
  id: number;
  title: string;
  source: string;            // text description of idea's origin
  categoryId: number;
  willingness: number;       // 0.0 ~ 1.0, controls relative circle size
  posX: number;              // canvas position X (normalized 0~1)
  posY: number;              // canvas position Y (normalized 0~1)
  createdAt: string;         // ISO datetime string
  updatedAt: string;         // ISO datetime string
  completionStatus: CompletionStatus | null;
  completionNote: string | null;
  completedAt: string | null;
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

export interface IdeaImage {
  id: number;
  ideaId: number;
  uri: string;
  sortOrder: number;
  createdAt: string;
}

// ─── Form / UI types ───

export type IdeaFormData = Omit<Idea, 'id' | 'updatedAt' | 'completionStatus' | 'completionNote' | 'completedAt'>;

export interface BubbleData {
  idea: Idea;
  radius: number;            // computed pixel radius (after scaling)
  screenX: number;           // computed screen X position (pixels)
  screenY: number;           // computed screen Y position (pixels)
  color: string;             // computed hex color from time elapsed
  elapsedLabel: string;      // e.g. "3h" or "5d"
}

// ─── Callback types ───

export type OnIdeaChange = () => void | Promise<void>;
