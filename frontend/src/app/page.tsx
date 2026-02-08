"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DailyBrief</h1>
          <button
            onClick={signOut}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Personalized Daily Podcast
          </h2>
          <p className="text-gray-700">
            Configure your sources and generate your briefing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/sources/substack"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📰</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">Substack</h2>
            <p className="text-gray-700 text-sm">
              Manage your newsletter subscriptions
            </p>
          </Link>
          <Link
            href="/sources/rss"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📡</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">RSS Feeds</h2>
            <p className="text-gray-700 text-sm">Add and manage RSS feeds</p>
          </Link>
          <Link
            href="/sources/topics"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">News Topics</h2>
            <p className="text-gray-700 text-sm">
              Track companies and topics
            </p>
          </Link>
          <Link
            href="/sources/notebooklm"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">🎙️</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">NotebookLM</h2>
            <p className="text-gray-700 text-sm">
              Connect your Google account
            </p>
          </Link>
          <Link
            href="/schedule"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">⏰</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">Schedule</h2>
            <p className="text-gray-700 text-sm">
              Set up daily generation time
            </p>
          </Link>
          <Link
            href="/generate"
            className="bg-blue-600 text-white p-6 rounded-lg shadow-sm border border-blue-700 hover:bg-blue-700 transition"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h2 className="font-semibold text-lg mb-2">Generate Now</h2>
            <p className="text-blue-100 text-sm">
              Create podcast immediately
            </p>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Generation History</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            View the history of your podcast generations and their status.
          </p>
          <Link
            href="/generations"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View all generations →
          </Link>
        </div>
      </div>
    </main>
  );
}
