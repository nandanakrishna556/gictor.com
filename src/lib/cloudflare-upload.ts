const CLOUDFLARE_WORKER_URL = 'https://gictor-ugc-upload-worker.nandanakrishna556.workers.dev';
const R2_PUBLIC_URL = 'https://pub-9a6eb4f4a27e4eb486d2c73c1902506f.r2.dev';

interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_SIZE = 500 * 1024 * 1024; // 500MB

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/ogg'];
const DEFAULT_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const DEFAULT_ALLOWED_TYPES = [...DEFAULT_IMAGE_TYPES, ...DEFAULT_AUDIO_TYPES, ...DEFAULT_VIDEO_TYPES];

/**
 * Check if a MIME type is a video type
 */
const isVideoType = (type: string): boolean => {
  return DEFAULT_VIDEO_TYPES.includes(type);
};

/**
 * Upload a single file to Cloudflare R2
 * @param file - The file to upload
 * @param options - Optional configuration
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadToR2 = async (file: File, options: UploadOptions = {}): Promise<string> => {
  const {
    folder = 'uploads',
    maxSize,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  // Determine max size based on file type if not explicitly provided
  const effectiveMaxSize = maxSize ?? (isVideoType(file.type) ? VIDEO_MAX_SIZE : DEFAULT_MAX_SIZE);

  // Validate file size
  if (file.size > effectiveMaxSize) {
    const maxMB = Math.round(effectiveMaxSize / 1024 / 1024);
    throw new Error(`File size exceeds ${maxMB}MB limit`);
  }
  
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    const allowed = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    throw new Error(`Invalid file type. Allowed: ${allowed}`);
  }
  
  // Generate unique filename with folder
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().slice(0, 8);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${timestamp}-${randomId}.${extension}`;
  
  // Upload to R2 via Cloudflare Worker
  const response = await fetch(CLOUDFLARE_WORKER_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'X-Filename': fileName,
    },
    body: file,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('R2 Upload Error:', errorText);
    throw new Error('Upload failed. Please try again.');
  }
  
  const data: UploadResponse = await response.json();
  
  if (!data.success || !data.url) {
    throw new Error(data.error || 'Upload failed');
  }
  
  return data.url;
};

/**
 * Upload multiple files to Cloudflare R2
 * @param files - Array of files to upload
 * @param options - Optional configuration
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<string[]> - Array of public URLs
 */
export const uploadMultipleToR2 = async (
  files: File[],
  options: UploadOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const url = await uploadToR2(files[i], options);
    urls.push(url);
    onProgress?.(i + 1, files.length);
  }
  
  return urls;
};

/**
 * Validate a file before upload (useful for pre-validation)
 * @param file - The file to validate
 * @param options - Optional configuration
 * @returns { valid: boolean, error?: string }
 */
export const validateFile = (
  file: File,
  options: UploadOptions = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  // Determine max size based on file type if not explicitly provided
  const effectiveMaxSize = maxSize ?? (isVideoType(file.type) ? VIDEO_MAX_SIZE : DEFAULT_MAX_SIZE);

  if (file.size > effectiveMaxSize) {
    const maxMB = Math.round(effectiveMaxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  if (!allowedTypes.includes(file.type)) {
    const allowed = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return { valid: false, error: `Invalid file type. Allowed: ${allowed}` };
  }

  return { valid: true };
};

/**
 * Get the public URL for a filename (if you need to construct URLs manually)
 */
export const getR2PublicUrl = (filename: string): string => {
  return `${R2_PUBLIC_URL}/${filename}`;
};

// Export constants for use in components
export { DEFAULT_VIDEO_TYPES, VIDEO_MAX_SIZE, DEFAULT_IMAGE_TYPES, DEFAULT_AUDIO_TYPES };
