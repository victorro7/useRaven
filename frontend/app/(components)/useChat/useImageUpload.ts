// app/(components)/useImageUpload.ts (Using modified useApiRequest)
import { useCallback } from 'react';
import { useApiRequest } from './useApiRequest';

interface PresignedUrlResponse {
  url: string;
  gcs_url: string;
}

export const useImageUpload = () => {
  const { makeRequest, loading, error } = useApiRequest();

    const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      // 1. Get the presigned URL
      const presignedUrlResponse = await makeRequest<PresignedUrlResponse>({
        method: 'POST',
        path: '/api/upload-url',
        body: {
          filename: file.name,
          contentType: file.type,
        },
        shouldAuthorize: true, // Authorize with Clerk token
      });

      if (!presignedUrlResponse) {
        throw new Error('Failed to get presigned URL');
      }

      const { url, gcs_url } = presignedUrlResponse;
      // 2. Upload the file directly to GCS using the presigned URL
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`GCS upload failed: ${uploadResponse.statusText}`);
      }

      // 3. Return the *final* GCS URL
      return gcs_url;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      return null; // Or handle the error as appropriate for your UI
    }
  }, [makeRequest]); // Add makeRequest to the dependency array


  return { uploadImage, loading, error };
};