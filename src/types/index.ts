export type EventCategory =
  | "brand-deal"
  | "content-shoot"
  | "live-stream"
  | "collaboration"
  | "deadline";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  category: EventCategory;
  description: string;
}
