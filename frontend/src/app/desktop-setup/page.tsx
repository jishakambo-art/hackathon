"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DesktopSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function getToken() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      }
    }

    if (user) {
      getToken();
    }
  }, [user]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accessToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="text-gray-700 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg border shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Desktop App Setup
            </h1>
            <p className="text-gray-700">
              Copy your access token to paste into the desktop app
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Access Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={accessToken}
                readOnly
                className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the token above</li>
              <li>Open the DailyBrief desktop app</li>
              <li>Paste the token when prompted</li>
              <li>Click "Verify Token"</li>
              <li>Continue with NotebookLM setup</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-800">
                <strong>Security Note:</strong> This token gives access to your account. Only paste it in the official DailyBrief desktop app. The token expires after 1 hour.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
