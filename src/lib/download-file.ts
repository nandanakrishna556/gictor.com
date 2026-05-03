import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DOWNLOAD_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-file`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Hosts known to send permissive CORS headers — try direct fetch first for these.
const DIRECT_FETCH_HOST_SUFFIXES = ['.fal.media'];

function canDirectFetch(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DIRECT_FETCH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

async function getAccessToken() {
  const { data: sessionData } = await supabase.auth.getSession();
  const existingToken = sessionData.session?.access_token ?? null;

  if (!sessionData.session) return null;

  try {
    const { data: refreshedData, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return refreshedData.session?.access_token ?? existingToken;
  } catch {
    return existingToken;
  }
}

async function fetchViaProxy(url: string, filename: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('No active session');

  const response = await fetch(DOWNLOAD_FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, filename }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Proxy download failed: ${response.status} ${errorText}`);
  }

  return response.blob();
}

async function fetchDirect(url: string) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Direct fetch failed: ${response.status}`);
  return response.blob();
}

export type DownloadOptions = {
  /** Hide the loading toast (still shows success/error). */
  silent?: boolean;
};

/**
 * Force-download a (possibly cross-origin) URL with toast feedback.
 *
 * Tries a direct CORS fetch first for hosts known to allow it; otherwise
 * routes through the authenticated `download-file` edge function so that
 * cross-origin assets (R2, etc.) save instead of opening in a new tab.
 *
 * Returns true on success, false on failure.
 */
export async function downloadFile(
  url: string,
  filename: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const toastId = options.silent
    ? undefined
    : toast.loading(`Preparing ${filename}...`);

  try {
    let blob: Blob;
    if (canDirectFetch(url)) {
      try {
        blob = await fetchDirect(url);
      } catch {
        blob = await fetchViaProxy(url, filename);
      }
    } else {
      blob = await fetchViaProxy(url, filename);
    }

    triggerBrowserDownload(blob, filename);

    if (toastId !== undefined) {
      toast.success(`Downloaded ${filename}`, { id: toastId });
    } else {
      toast.success(`Downloaded ${filename}`);
    }
    return true;
  } catch (error) {
    console.error('[downloadFile] Failed:', error);
    if (toastId !== undefined) {
      toast.error(`Failed to download ${filename}`, { id: toastId });
    } else {
      toast.error(`Failed to download ${filename}`);
    }
    return false;
  }
}

export function buildDownloadFilename(name: string, ext: string): string {
  const safe = (name || 'download').replace(/[\/\\]+/g, '_').trim() || 'download';
  const cleanExt = ext.replace(/^\./, '');
  return `${safe}.${cleanExt}`;
}

/**
 * Hook providing per-button loading state for downloads. Wraps `downloadFile`
 * so the calling component does not have to manage `useState` plumbing.
 */
export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async (url: string, filename: string, options?: DownloadOptions) => {
    if (isDownloading) return false;
    setIsDownloading(true);
    try {
      return await downloadFile(url, filename, options);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  return { download, isDownloading };
}
