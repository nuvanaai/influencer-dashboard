import { EventCategory } from "@/types";

export const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  "brand-deal": {
    label: "Brand Deal",
    color: "#8B5CF6",
    bgClass: "bg-brandDeal/20",
    textClass: "text-brandDeal",
  },
  "content-shoot": {
    label: "Content Shoot",
    color: "#F59E0B",
    bgClass: "bg-contentShoot/20",
    textClass: "text-contentShoot",
  },
  "live-stream": {
    label: "Live Stream",
    color: "#EF4444",
    bgClass: "bg-liveStream/20",
    textClass: "text-liveStream",
  },
  collaboration: {
    label: "Collaboration",
    color: "#3B82F6",
    bgClass: "bg-collaboration/20",
    textClass: "text-collaboration",
  },
  deadline: {
    label: "Deadline",
    color: "#6B7280",
    bgClass: "bg-deadline/20",
    textClass: "text-deadline",
  },
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export function generateCalendarDays(
  year: number,
  month: number
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month's leading days (fill to 42 cells = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthName(month: number): string {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month];
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
