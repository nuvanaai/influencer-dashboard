"use client";

import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import CalendarHeader from "@/components/CalendarHeader";
import CalendarGrid from "@/components/CalendarGrid";
import EventModal from "@/components/EventModal";

export default function DashboardPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleAddEvent = () => {
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
          onToday={goToToday}
          onAddEvent={handleAddEvent}
        />
        <CalendarGrid
          year={currentYear}
          month={currentMonth}
          onDayClick={handleDayClick}
        />
      </main>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prefilledDate={selectedDate}
      />
    </div>
  );
}
