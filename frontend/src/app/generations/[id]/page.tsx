"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getGeneration } from "@/lib/api";

interface Generation {
  id: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  status: "scheduled" | "fetching" | "generating" | "complete" | "failed";
  notebook_id?: string;
  sources_used?: {
    substack_posts: number;
    rss_feeds: number;
    news_topics: number;
    total_items: number;
  };
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

export default function GenerationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: generation, isLoading } = useQuery<Generation>({
    queryKey: ["generation", params.id],
    queryFn: () => getGeneration(params.id),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "complete" || data?.status === "failed" ? false : 3000;
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/generations" className="text-gray-700 hover:text-gray-900">
            ← Back to History
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {generation && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Generation Details</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusColors[generation.status]
                  }`}
                >
                  {statusLabels[generation.status]}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700">Scheduled</p>
                  <p className="font-medium text-gray-900">
                    {new Date(generation.scheduled_at).toLocaleString()}
                  </p>
                </div>
                {generation.started_at && (
                  <div>
                    <p className="text-gray-700">Started</p>
                    <p className="font-medium text-gray-900">
                      {new Date(generation.started_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {generation.completed_at && (
                  <div>
                    <p className="text-gray-700">Completed</p>
                    <p className="font-medium text-gray-900">
                      {new Date(generation.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {generation.notebook_id && (
                  <div>
                    <p className="text-gray-700">Notebook ID</p>
                    <p className="font-medium font-mono text-xs">
                      {generation.notebook_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {generation.status === "fetching" ||
            generation.status === "generating" ? (
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-800">
                  {generation.status === "fetching"
                    ? "Fetching content from your sources..."
                    : "Generating your podcast in NotebookLM..."}
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  This may take a few minutes. This page will update automatically.
                </p>
              </div>
            ) : null}

            {generation.status === "complete" && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="font-semibold text-green-900 mb-4">
                  Podcast Ready!
                </h2>
                <p className="text-green-800 mb-4">
                  Your podcast has been generated and is available in NotebookLM.
                </p>
                <a
                  href="https://notebooklm.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Open NotebookLM →
                </a>
              </div>
            )}

            {generation.status === "failed" && (
              <div className="bg-red-50 p-6 rounded-lg">
                <h2 className="font-semibold text-red-900 mb-2">
                  Generation Failed
                </h2>
                <p className="text-red-800">
                  {generation.error_message || "An unknown error occurred."}
                </p>
              </div>
            )}

            {generation.sources_used && (
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="font-semibold mb-4 text-gray-900">Sources Used</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {generation.sources_used.substack_posts}
                    </p>
                    <p className="text-sm text-gray-700">Substack Posts</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {generation.sources_used.rss_feeds}
                    </p>
                    <p className="text-sm text-gray-700">RSS Feeds</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {generation.sources_used.news_topics}
                    </p>
                    <p className="text-sm text-gray-700">News Topics</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {generation.sources_used.total_items}
                    </p>
                    <p className="text-sm text-gray-700">Total Items</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
