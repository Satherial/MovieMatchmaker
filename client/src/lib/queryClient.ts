import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { extractErrorMessage } from './error-handler';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    try {
      // Try to parse as JSON to extract the error message
      const jsonData = JSON.parse(text);
      if (jsonData.error) {
        // Just return the error message string, not wrapped in JSON
        throw new Error(jsonData.error);
      }
    } catch (parseError) {
      // If we can't parse as JSON or there's no error field, fall back to the text
      throw new Error(text || res.statusText);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // The first element is the base URL, and the second is an object of query parameters
    const baseUrl = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any> | undefined;
    
    // Construct URL with query parameters
    let url = baseUrl;
    if (params) {
      const searchParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      
      const searchString = searchParams.toString();
      if (searchString) {
        url = `${baseUrl}?${searchString}`;
      }
    }
    
    console.log('Fetching with URL:', url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
