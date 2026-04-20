import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DOWNLOAD_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-file`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function getAccessToken() {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  if (session) {
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshedData.session) {
      session = refreshedData.session;
    }
  }

  return session?.access_token ?? null;
}

async function directDownload(url: string, filename: string) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const blob = await response.blob();
  await triggerBrowserDownload(blob, filename);
}

export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No active session');
    }

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

    const blob = await response.blob();
    await triggerBrowserDownload(blob, filename);
    return true;
  } catch (proxyError) {
    console.error('[downloadFile] Proxy download failed, trying direct fetch:', proxyError);

    try {
      await directDownload(url, filename);
      return true;
    } catch (directError) {
      console.error('[downloadFile] Direct download failed:', directError);
      toast.error('Failed to download file');
      return false;
    }
  }
}

export function buildDownloadFilename(name: string, ext: string): string {
  const safe = (name || 'download').replace(/[\/\\]+/g, '_').trim() || 'download';
  const cleanExt = ext.replace(/^\./, '');
  return `${safe}.${cleanExt}`;
}
