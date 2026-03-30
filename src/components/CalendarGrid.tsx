"use client";

import { generateCalendarDays, formatDateKey } from "@/lib/calendarUtils";
import CalendarDayCell from "./CalendarDayCell";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  year: number;
  month: number;
  onDayClick: (dateKey: string) => void;
}

export default function CalendarGrid({
  year,
  month,
  onDayClick,
}: CalendarGridProps) {
  const days = generateCalendarDays(year, month);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs text-gray-500 uppercase tracking-wider py-2 font-medium"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-l border-gray-800">
        {days.map((day, i) => (
          <CalendarDayCell
            key={i}
            date={day.date}
            isCurrentMonth={day.isCurrentMonth}
            onClick={() => onDayClick(formatDateKey(day.date))}
          />
        ))}
      </div>
    </div>
  );
}
