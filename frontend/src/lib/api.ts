import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

// Export as apiRequest for general use
export const apiRequest = fetchWithAuth;

// Substack
export async function getSubstackSubscriptions() {
  return fetchWithAuth("/substack/subscriptions");
}

export async function setSubstackPriorities(priorities: Record<string, number>) {
  return fetchWithAuth("/substack/priorities", {
    method: "PUT",
    body: JSON.stringify({ priorities }),
  });
}

// RSS
export async function getRssSources() {
  return fetchWithAuth("/rss");
}

export async function addRssSource(url: string, name: string) {
  return fetchWithAuth("/rss", {
    method: "POST",
    body: JSON.stringify({ url, name }),
  });
}

export async function deleteRssSource(id: string) {
  return fetchWithAuth(`/rss/${id}`, { method: "DELETE" });
}

// Topics
export async function getTopics() {
  return fetchWithAuth("/topics");
}

export async function addTopic(topic: string) {
  return fetchWithAuth("/topics", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
}

export async function deleteTopic(id: string) {
  return fetchWithAuth(`/topics/${id}`, { method: "DELETE" });
}

// Generation
export async function triggerGeneration() {
  return fetchWithAuth("/generate", { method: "POST" });
}

export async function getGenerations() {
  return fetchWithAuth("/generations");
}

export async function getGeneration(id: string) {
  return fetchWithAuth(`/generations/${id}`);
}
