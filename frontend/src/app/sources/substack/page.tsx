"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSubstackSubscriptions, setSubstackPriorities } from "@/lib/api";

interface Subscription {
  id: string;
  publication_id: string;
  publication_name: string;
  priority: number | null;
  enabled: boolean;
}

function SubstackPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [showConnectedMessage, setShowConnectedMessage] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ["substack-subscriptions"],
    queryFn: getSubstackSubscriptions,
  });

  const saveMutation = useMutation({
    mutationFn: (priorities: Record<string, number>) =>
      setSubstackPriorities(priorities),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substack-subscriptions"] });
    },
  });

  useEffect(() => {
    if (subscriptions) {
      const existing: Record<string, number> = {};
      subscriptions.forEach((sub: Subscription) => {
        if (sub.priority) {
          existing[sub.publication_id] = sub.priority;
        }
      });
      setPriorities(existing);
    }
  }, [subscriptions]);

  useEffect(() => {
    // Check if user just connected Substack
    if (searchParams.get("connected") === "true") {
      setShowConnectedMessage(true);
      queryClient.invalidateQueries({ queryKey: ["substack-subscriptions"] });

      // Hide message after 5 seconds
      setTimeout(() => {
        setShowConnectedMessage(false);
      }, 5000);
    }
  }, [searchParams, queryClient]);

  function handlePriorityChange(publicationId: string, priority: string) {
    const newPriorities = { ...priorities };
    if (priority === "") {
      delete newPriorities[publicationId];
    } else {
      const num = parseInt(priority);
      if (num >= 1 && num <= 5) {
        newPriorities[publicationId] = num;
      }
    }
    setPriorities(newPriorities);
  }

  function handleSave() {
    saveMutation.mutate(priorities);
  }

  const prioritizedCount = Object.keys(priorities).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showConnectedMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-800 font-medium">
                Substack account connected successfully! Your subscriptions have been loaded.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Substack Subscriptions</h1>
            <p className="text-gray-700 mt-1">
              Select your top 5 priority newsletters ({prioritizedCount}/5
              selected)
            </p>
          </div>
          <a
            href={`${API_URL}/auth/substack`}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
          >
            Connect Substack
          </a>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            Failed to load subscriptions. Make sure you've connected your
            Substack account.
          </div>
        )}

        {subscriptions && subscriptions.length === 0 && (
          <div className="bg-white p-8 rounded-lg border text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">📰</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Your Substack Account
            </h2>
            <p className="text-gray-700 mb-6">
              Connect to view and prioritize your newsletter subscriptions
            </p>
            <a
              href="http://localhost:8000/auth/substack"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
            >
              Connect Substack
            </a>
          </div>
        )}

        {subscriptions && subscriptions.length > 0 && (
          <>
            <div className="bg-white rounded-lg border divide-y">
              {subscriptions.map((sub: Subscription) => (
                <div
                  key={sub.id}
                  className="p-4 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{sub.publication_name}</span>
                  <select
                    value={priorities[sub.publication_id] || ""}
                    onChange={(e) =>
                      handlePriorityChange(sub.publication_id, e.target.value)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Not prioritized</option>
                    <option value="1">Priority 1</option>
                    <option value="2">Priority 2</option>
                    <option value="3">Priority 3</option>
                    <option value="4">Priority 4</option>
                    <option value="5">Priority 5</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? "Saving..." : "Save Priorities"}
              </button>
            </div>

            {saveMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                Priorities saved successfully!
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function SubstackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </main>
    }>
      <SubstackPageContent />
    </Suspense>
  );
}
