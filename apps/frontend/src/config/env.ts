const fallbackApiBaseUrl = "http://localhost:4111";

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl,
} as const;
