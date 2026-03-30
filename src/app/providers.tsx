"use client";

import { EventsProvider } from "@/context/EventsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <EventsProvider>{children}</EventsProvider>;
}
