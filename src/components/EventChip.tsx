"use client";

import { CalendarEvent } from "@/types";
import { CATEGORY_CONFIG } from "@/lib/calendarUtils";

interface EventChipProps {
  event: CalendarEvent;
}

export default function EventChip({ event }: EventChipProps) {
  const config = CATEGORY_CONFIG[event.category];

  return (
    <div
      className={`${config.bgClass} ${config.textClass} text-[10px] leading-tight truncate rounded px-1.5 py-0.5 mb-0.5 cursor-default`}
      title={`${event.time} - ${event.title}`}
    >
      {event.title}
    </div>
  );
}
