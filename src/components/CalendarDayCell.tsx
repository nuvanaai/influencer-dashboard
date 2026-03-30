"use client";

import { useEvents } from "@/context/EventsContext";
import { formatDateKey, isToday } from "@/lib/calendarUtils";
import EventChip from "./EventChip";

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  onClick: () => void;
}

export default function CalendarDayCell({
  date,
  isCurrentMonth,
  onClick,
}: CalendarDayCellProps) {
  const { getEventsForDate } = useEvents();
  const dateKey = formatDateKey(date);
  const events = getEventsForDate(dateKey);
  const today = isToday(date);
  const maxVisible = 2;

  return (
    <div
      onClick={onClick}
      className={`min-h-[100px] border border-gray-800 p-1.5 cursor-pointer transition-colors hover:bg-gray-900/50 ${
        !isCurrentMonth ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
            today
              ? "bg-brandDeal text-white"
              : isCurrentMonth
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        >
          {date.getDate()}
        </span>
        {events.length > 0 && (
          <span className="text-[9px] text-gray-500">{events.length}</span>
        )}
      </div>
      <div className="space-y-0.5">
        {events.slice(0, maxVisible).map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
        {events.length > maxVisible && (
          <div className="text-[9px] text-gray-500 px-1">
            +{events.length - maxVisible} more
          </div>
        )}
      </div>
    </div>
  );
}
