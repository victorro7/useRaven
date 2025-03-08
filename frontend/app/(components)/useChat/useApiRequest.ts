/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(components)/useApiRequest.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { BASE_URL } from './constants';

interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  shouldAuthorize?: boolean;
  contentType?: string;
}

export const useApiRequest = () => {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const makeRequest = useCallback(async <T>({ method, path, body, shouldAuthorize = true, contentType }: ApiRequestOptions): Promise<T | null> => {
        setLoading(true);
        setError(null);

        if(abortController){
          abortController.abort();
        }
        const newAbortController = new AbortController();
        setAbortController(newAbortController);

        try {
            const headers: Record<string, string> = {};

            if (contentType) {
              headers['Content-Type'] = contentType; //use provided content type.
            } else {
              headers['Content-Type'] = 'application/json'; // Default to JSON
            }

            if(shouldAuthorize) {
              const token = await getToken({ template: "kvbackend" });
              if (!token) {
                  throw new Error("Authentication token not available.");
              }
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${BASE_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: newAbortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }

            if (response.status === 204) { // No Content
                return null;
            }
            return await response.json() as T;

        } catch (err: any) {
          if (err instanceof DOMException && err.name === 'AbortError') {
              // Don't set an error message for AbortError
          } else {
            setError(err.message || "An unexpected error occurred.");
          }
          return null;
        } finally {
          setLoading(false);
          if(abortController === newAbortController){
            setAbortController(null);
          }
        }
    }, []);

    return { makeRequest, loading, error, abortController };
};