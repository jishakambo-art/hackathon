"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getSchedulePreferences, updateSchedulePreferences } from "@/lib/api";

// Common timezone options
const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("07:00");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch current schedule
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule"],
    queryFn: getSchedulePreferences,
  });

  // Update local state when data loads
  useEffect(() => {
    if (schedule) {
      setEnabled(schedule.daily_generation_enabled);
      setTime(schedule.generation_time);
      setTimezone(schedule.timezone);
    }
  }, [schedule]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateSchedulePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      daily_generation_enabled: enabled,
      generation_time: time,
      timezone: timezone,
    });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const hourStr = hour.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        const value = `${hourStr}:${minuteStr}`;

        // Convert to 12-hour format for display
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? "AM" : "PM";
        const label = `${displayHour}:${minuteStr} ${period}`;

        options.push({ value, label });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Daily Generation Schedule</h1>
          <p className="text-gray-600 mb-8">
            Configure when your daily podcast should be generated automatically
          </p>

          {/* Enable/Disable Toggle */}
          <div className="mb-8 pb-8 border-b">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900 mb-1">Enable Daily Generation</div>
                <div className="text-sm text-gray-600">
                  Automatically generate a podcast every day at your chosen time
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2">
                  <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-6"></div>
                </div>
              </div>
            </label>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generation Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!enabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Select the time when your daily podcast should be generated
            </p>
          </div>

          {/* Timezone Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!enabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              The timezone for your generation time
            </p>
          </div>

          {/* Info Box */}
          {enabled && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <strong>Next generation:</strong> Your podcast will be automatically generated daily at{" "}
                  {timeOptions.find((t) => t.value === time)?.label} ({TIMEZONES.find((tz) => tz.value === timezone)?.label})
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Schedule saved successfully!
              </div>
            </div>
          )}

          {/* Error Message */}
          {updateMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">
                Failed to save schedule. Please try again.
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {updateMutation.isPending ? "Saving..." : "Save Schedule"}
          </button>
        </div>

        {/* How it Works */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h2 className="font-medium text-blue-900 mb-3">How Daily Generation Works</h2>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>At your scheduled time, our server automatically starts the generation process</li>
            <li>We fetch the latest content from all your configured sources (Substack, RSS, Topics)</li>
            <li>A new NotebookLM notebook is created with all the aggregated content</li>
            <li>NotebookLM generates a podcast from the content</li>
            <li>You can listen to your podcast in the NotebookLM app!</li>
          </ol>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-2">Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Make sure you have at least one source configured (Substack, RSS, or Topics)</li>
            <li>Ensure NotebookLM is connected via the desktop app</li>
            <li>Generation typically takes 5-10 minutes to complete</li>
            <li>You can still manually generate podcasts anytime from the dashboard</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
