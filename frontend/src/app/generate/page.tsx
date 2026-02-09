"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { triggerGeneration } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function GeneratePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [generated, setGenerated] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const mutation = useMutation({
    mutationFn: triggerGeneration,
    onSuccess: (data) => {
      setGenerated(true);
      // Redirect to generation status page after a moment
      setTimeout(() => {
        router.push(`/generations/${data.id}`);
      }, 2000);
    },
  });

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
        <div className="bg-white p-8 rounded-lg border text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Generate Podcast</h1>
          <p className="text-gray-700 mb-8">
            This will fetch content from all your sources and generate a new
            podcast in NotebookLM.
          </p>

          {!generated && !mutation.isPending && (
            <button
              onClick={() => mutation.mutate()}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-lg"
            >
              Generate Now
            </button>
          )}

          {mutation.isPending && (
            <div className="py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-700">Starting generation...</p>
            </div>
          )}

          {mutation.isError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              Failed to start generation. Please try again.
            </div>
          )}

          {generated && (
            <div className="py-4">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <p className="text-gray-700">
                Generation started! Redirecting to status page...
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-medium text-blue-900 mb-2">How it works</h2>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>We fetch the latest content from your Substack subscriptions</li>
            <li>We fetch posts from your RSS feeds</li>
            <li>We query Perplexity for news on your tracked topics</li>
            <li>All content is added to a new NotebookLM notebook</li>
            <li>NotebookLM generates a podcast from the content</li>
            <li>You can listen in the NotebookLM app!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
