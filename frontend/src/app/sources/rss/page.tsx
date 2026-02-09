"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRssSources, addRssSource, deleteRssSource } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface RssSource {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
}

export default function RssPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["rss-sources"],
    queryFn: getRssSources,
  });

  const addMutation = useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) =>
      addRssSource(url, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-sources"] });
      setUrl("");
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRssSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-sources"] });
    },
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (url && name) {
      addMutation.mutate({ url, name });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">RSS Feeds</h1>

        <form
          onSubmit={handleAdd}
          className="bg-white p-4 rounded-lg border mb-6"
        >
          <h2 className="font-medium mb-4 text-gray-900">Add New Feed</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feed Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., TechCrunch"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feed URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {addMutation.isPending ? "Adding..." : "Add Feed"}
          </button>
        </form>

        {addMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            Failed to add feed. Please check the URL and try again.
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {sources && sources.length === 0 && (
          <div className="bg-white p-8 rounded-lg border text-center">
            <p className="text-gray-700">
              No RSS feeds added yet. Add your first feed above.
            </p>
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="bg-white rounded-lg border divide-y">
            {sources.map((source: RssSource) => (
              <div
                key={source.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{source.name}</p>
                  <p className="text-sm text-gray-700 truncate max-w-md">
                    {source.url}
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(source.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
