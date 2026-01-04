import axios from 'axios';

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

interface UploadResponse {
  success: boolean;
  data?: {
    ipfsHash: string;
    ipfsUrl: string;
    pinSize?: number;
    timestamp?: string;
  };
  error?: string;
}

/**
 * Upload file to IPFS via backend API (secure - keys not exposed)
 * @param file - File to upload
 * @param name - Optional name for the file
 * @returns IPFS URL of the uploaded file
 */
export async function uploadToPinata(file: File, name?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  // Add metadata
  const metadata = JSON.stringify({
    name: name || file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
      type: file.type,
    }
  });
  formData.append('pinataMetadata', metadata);

  // Pin options
  const options = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', options);

  try {
    const response = await axios.post<UploadResponse>(
      `${API_URL}/api/upload/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for uploads
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Upload failed');
    }

    return response.data.data.ipfsUrl;
  } catch (error: any) {
    console.error('Upload error:', error.response?.data || error.message);
    
    if (error.response?.status === 503) {
      throw new Error('Upload service not available. Please try again later.');
    }
    if (error.response?.status === 413) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
  }
}

/**
 * Upload JSON metadata to IPFS via backend API
 * @param metadata - JSON object to upload
 * @param name - Name for the metadata file
 * @returns IPFS URL of the uploaded metadata
 */
export async function uploadMetadataToPinata(metadata: object, name: string): Promise<string> {
  try {
    const response = await axios.post<UploadResponse>(
      `${API_URL}/api/upload/json`,
      {
        content: metadata,
        name: name,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Upload failed');
    }

    return response.data.data.ipfsUrl;
  } catch (error: any) {
    console.error('Metadata upload error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to upload metadata');
  }
}

/**
 * Check if upload service is available
 */
export async function isPinataConfigured(): Promise<boolean> {
  try {
    const response = await axios.get<{ success: boolean; configured: boolean }>(
      `${API_URL}/api/upload/status`,
      { timeout: 5000 }
    );
    return response.data.configured;
  } catch {
    return false;
  }
}

/**
 * Synchronous check - always returns true since we use backend
 * For backward compatibility with existing code
 */
export function isPinataConfiguredSync(): boolean {
  // Always return true - actual check happens on backend
  // This maintains backward compatibility with existing code
  return true;
}
