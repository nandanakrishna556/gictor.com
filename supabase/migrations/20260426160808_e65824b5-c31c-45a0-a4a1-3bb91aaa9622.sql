UPDATE public.files f
SET
  generation_status = 'completed',
  download_url = COALESCE(f.download_url, p.final_video_output->>'url'),
  preview_url = COALESCE(f.preview_url, p.final_video_output->>'url'),
  progress = 100,
  error_message = NULL,
  updated_at = now()
FROM public.pipelines p
WHERE
  (f.generation_params->>'pipeline_id')::uuid = p.id
  AND p.status = 'completed'
  AND p.final_video_output->>'url' IS NOT NULL
  AND (
    f.generation_status IS DISTINCT FROM 'completed'
    OR f.download_url IS NULL
  );