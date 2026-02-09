"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGenerations } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Generation {
  id: string;
  scheduled_at: string;
  status: "scheduled" | "fetching" | "generating" | "complete" | "failed";
  notebook_id?: string;
  error_message?: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-gray-100 text-gray-900",
  fetching: "bg-blue-100 text-blue-900",
  generating: "bg-yellow-100 text-yellow-900",
  complete: "bg-green-100 text-green-900",
  failed: "bg-red-100 text-red-900",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  fetching: "Fetching content...",
  generating: "Generating podcast...",
  complete: "Complete",
  failed: "Failed",
};

export default function GenerationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations"],
    queryFn: getGenerations,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
          <Link
            href="/generate"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
          >
            Generate Now
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Generation History</h1>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {generations && generations.length === 0 && (
          <div className="bg-white p-8 rounded-lg border text-center">
            <p className="text-gray-700 mb-4">No generations yet.</p>
            <Link
              href="/generate"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Generate Your First Podcast
            </Link>
          </div>
        )}

        {generations && generations.length > 0 && (
          <div className="bg-white rounded-lg border divide-y">
            {generations.map((gen: Generation) => (
              <Link
                key={gen.id}
                href={`/generations/${gen.id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition block"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(gen.scheduled_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "America/Los_Angeles",
                    })}
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date(gen.scheduled_at).toLocaleTimeString("en-US", {
                      timeZone: "America/Los_Angeles",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })} PST
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusColors[gen.status]
                  }`}
                >
                  {statusLabels[gen.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
