// Lightweight module-level drag state for cross-context HTML5 native drag-and-drop
// (used to drag selected cards onto sidebar projects, where hello-pangea/dnd cannot reach).

export type CardDragPayload = {
  ids: string[];
  sourceProjectId: string;
};

let currentPayload: CardDragPayload | null = null;
const listeners = new Set<(payload: CardDragPayload | null) => void>();

export const cardDragState = {
  get(): CardDragPayload | null {
    return currentPayload;
  },
  set(payload: CardDragPayload | null) {
    currentPayload = payload;
    listeners.forEach((l) => l(payload));
  },
  subscribe(listener: (payload: CardDragPayload | null) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const CARD_DRAG_MIME = 'application/x-gictor-cards';
