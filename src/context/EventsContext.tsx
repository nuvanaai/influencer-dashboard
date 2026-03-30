"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { CalendarEvent } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface EventsContextValue {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (dateKey: string) => CalendarEvent[];
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(
    "influencer-events",
    []
  );

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      const newEvent: CalendarEvent = {
        ...event,
        id: crypto.randomUUID(),
      };
      setEvents((prev) => [...prev, newEvent]);
    },
    [setEvents]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [setEvents]
  );

  const getEventsForDate = useCallback(
    (dateKey: string) => {
      return events
        .filter((e) => e.date === dateKey)
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    [events]
  );

  return (
    <EventsContext.Provider
      value={{ events, addEvent, deleteEvent, getEventsForDate }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents(): EventsContextValue {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
