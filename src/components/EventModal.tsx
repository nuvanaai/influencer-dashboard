"use client";

import { useState, useEffect } from "react";
import { EventCategory } from "@/types";
import { CATEGORY_CONFIG } from "@/lib/calendarUtils";
import { useEvents } from "@/context/EventsContext";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledDate: string | null;
}

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [
  EventCategory,
  (typeof CATEGORY_CONFIG)[EventCategory]
][];

export default function EventModal({
  isOpen,
  onClose,
  prefilledDate,
}: EventModalProps) {
  const { addEvent } = useEvents();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [category, setCategory] = useState<EventCategory>("brand-deal");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (prefilledDate) {
      setDate(prefilledDate);
    }
  }, [prefilledDate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    addEvent({
      title: title.trim(),
      date,
      time,
      category,
      description: description.trim(),
    });

    setTitle("");
    setDate("");
    setTime("10:00");
    setCategory("brand-deal");
    setDescription("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg mx-4 bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Add Event</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nike Brand Deal Shoot"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-brandDeal transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-brandDeal transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-brandDeal transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    category === key
                      ? `${config.bgClass} ${config.textClass} border-current`
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Description{" "}
              <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details about this event..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-brandDeal transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brandDeal hover:bg-brandDeal/80 rounded-lg text-sm font-medium transition-colors"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
