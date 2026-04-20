/**
 * Force-download a file from a (possibly cross-origin) URL.
 *
 * Browsers ignore the `download` attribute on <a> when the href is
 * cross-origin (e.g., R2/Supabase Storage), and instead just open the
 * file in the same tab. To work around this, we fetch the file as a
 * blob, create a same-origin object URL, and trigger the download.
 *
 * Falls back to opening the URL in a new tab if the fetch fails
 * (e.g., due to CORS).
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so the download has time to start
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('[downloadFile] Falling back to new tab:', error);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Build a sane filename from a base name + extension. Strips path
 * separators and trims whitespace.
 */
export function buildDownloadFilename(name: string, ext: string): string {
  const safe = (name || 'download').replace(/[\/\\]+/g, '_').trim() || 'download';
  const cleanExt = ext.replace(/^\./, '');
  return `${safe}.${cleanExt}`;
}
