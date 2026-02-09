"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTopics, addTopic, deleteTopic } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Topic {
  id: string;
  topic: string;
  enabled: boolean;
}

export default function TopicsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [newTopic, setNewTopic] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const { data: topics, isLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: getTopics,
  });

  const addMutation = useMutation({
    mutationFn: addTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setNewTopic("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (newTopic.trim()) {
      addMutation.mutate(newTopic.trim());
    }
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">News Topics</h1>
        <p className="text-gray-700 mb-6">
          Add company names or topics to get AI-powered news summaries via
          Perplexity.
        </p>

        <form
          onSubmit={handleAdd}
          className="bg-white p-4 rounded-lg border mb-6"
        >
          <h2 className="font-medium mb-4 text-gray-900">Add New Topic</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g., Apple, AI regulations, Tesla"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
              required
            />
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {addMutation.isPending ? "Adding..." : "Add Topic"}
            </button>
          </div>
        </form>

        {addMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            Failed to add topic. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {topics && topics.length === 0 && (
          <div className="bg-white p-8 rounded-lg border text-center">
            <p className="text-gray-700">
              No topics added yet. Add companies or topics you want to track.
            </p>
          </div>
        )}

        {topics && topics.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b bg-gray-50">
              <p className="text-sm text-gray-700">
                {topics.length} topic{topics.length !== 1 ? "s" : ""} tracked
              </p>
            </div>
            <div className="divide-y">
              {topics.map((topic: Topic) => (
                <div
                  key={topic.id}
                  className="p-4 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{topic.topic}</span>
                  <button
                    onClick={() => deleteMutation.mutate(topic.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
