"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface NotebookLMStatus {
  authenticated: boolean;
  credentials?: {
    user_id: string;
    authenticated_at: string;
  };
}

async function getNotebookLMStatus(): Promise<NotebookLMStatus> {
  return apiRequest("/auth/notebooklm/status", { method: "GET" });
}

async function authenticateNotebookLM(): Promise<any> {
  return apiRequest("/auth/notebooklm/authenticate", { method: "POST" });
}

async function revokeNotebookLM(): Promise<any> {
  return apiRequest("/auth/notebooklm/revoke", { method: "DELETE" });
}

export default function NotebookLMPage() {
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["notebooklm-status"],
    queryFn: getNotebookLMStatus,
  });

  const authMutation = useMutation({
    mutationFn: authenticateNotebookLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooklm-status"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeNotebookLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooklm-status"] });
    },
  });

  async function handleAuthenticate() {
    setIsAuthenticating(true);
    try {
      await authMutation.mutateAsync();
    } finally {
      setIsAuthenticating(false);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            NotebookLM Connection
          </h1>
          <p className="text-gray-700 mt-1">
            Connect your Google account to generate podcasts via NotebookLM
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {!isLoading && status && (
          <div className="bg-white p-6 rounded-lg border">
            {!status.authenticated ? (
              <>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Connect to NotebookLM
                  </h2>
                  <p className="text-gray-700 mb-6">
                    Download the desktop app to authenticate with NotebookLM and enable automated podcast generation.
                  </p>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-amber-800">
                        <strong>Important:</strong> NotebookLM authentication requires a one-time desktop app setup. This is because NotebookLM doesn't have a public API, so we use browser automation that must run on your computer.
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://github.com/jishakambo-art/hackathon/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium w-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Desktop App (Mac)
                  </a>

                  <p className="mt-3 text-sm text-gray-600 text-center">
                    Windows version coming soon
                  </p>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Setup Steps
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Download and open the desktop app</li>
                    <li>Sign in with Google (you'll get a token)</li>
                    <li>Paste the token in the desktop app</li>
                    <li>Click "Connect NotebookLM" - a browser will open</li>
                    <li>Sign in to NotebookLM</li>
                    <li>Done! Your credentials are securely uploaded</li>
                    <li>Close the desktop app - you won't need it again</li>
                  </ol>
                  <p className="mt-3 text-xs text-blue-700">
                    After setup, daily podcasts will be generated automatically at 7am PT.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Connected to NotebookLM
                      </h2>
                      <p className="text-sm text-gray-700">
                        Your Google account is connected and ready to generate
                        podcasts
                      </p>
                    </div>
                  </div>
                </div>

                {status.credentials && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Connection Details
                    </h3>
                    <dl className="text-sm">
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-700">Status:</dt>
                        <dd className="text-gray-900 font-medium">Active</dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-700">Connected:</dt>
                        <dd className="text-gray-900">
                          {new Date(
                            status.credentials.authenticated_at
                          ).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => revokeMutation.mutate()}
                    disabled={revokeMutation.isPending}
                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {revokeMutation.isPending
                      ? "Disconnecting..."
                      : "Disconnect Account"}
                  </button>
                </div>

                {revokeMutation.isSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    Account disconnected successfully
                  </div>
                )}

                {revokeMutation.isError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    Failed to disconnect account
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
