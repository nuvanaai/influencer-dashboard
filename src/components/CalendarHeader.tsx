"use client";

import { getMonthName } from "@/lib/calendarUtils";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export default function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold min-w-[200px] text-center">
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <button
          onClick={onToday}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
      </div>
      <button
        onClick={onAddEvent}
        className="flex items-center gap-2 px-4 py-2 bg-brandDeal hover:bg-brandDeal/80 rounded-lg text-sm font-medium transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Event
      </button>
    </div>
  );
}
