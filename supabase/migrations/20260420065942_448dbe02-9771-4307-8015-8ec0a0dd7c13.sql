-- Backfill stuck lip_sync file whose pipeline finished but the file was never synced to completed.
UPDATE public.files f
SET
  generation_status = 'completed',
  progress = 100,
  download_url = COALESCE(f.download_url, (p.final_video_output->>'url')),
  preview_url = COALESCE(f.preview_url, (p.final_video_output->>'url')),
  updated_at = now()
FROM public.pipelines p
WHERE
  (f.generation_params->>'pipeline_id') = p.id::text
  AND p.status = 'completed'
  AND p.final_video_output IS NOT NULL
  AND (p.final_video_output->>'url') IS NOT NULL
  AND (f.generation_status = 'processing' OR f.generation_status IS NULL OR f.download_url IS NULL);