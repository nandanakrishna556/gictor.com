-- Pipeline state table to persist progress
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  tags TEXT[] DEFAULT '{}',
  
  -- Stage completion tracking
  current_stage TEXT NOT NULL DEFAULT 'first_frame' CHECK (current_stage IN ('first_frame', 'script', 'voice', 'final_video')),
  first_frame_complete BOOLEAN DEFAULT FALSE,
  script_complete BOOLEAN DEFAULT FALSE,
  voice_complete BOOLEAN DEFAULT FALSE,
  
  -- First Frame stage data
  first_frame_input JSONB DEFAULT '{}',
  first_frame_output JSONB DEFAULT NULL,
  
  -- Script stage data  
  script_input JSONB DEFAULT '{}',
  script_output JSONB DEFAULT NULL,
  
  -- Voice stage data
  voice_input JSONB DEFAULT '{}',
  voice_output JSONB DEFAULT NULL,
  
  -- Final Video stage data
  final_video_input JSONB DEFAULT '{}',
  final_video_output JSONB DEFAULT NULL,
  
  -- Final output file reference
  output_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_pipelines_project ON pipelines(project_id);
CREATE INDEX idx_pipelines_user ON pipelines(user_id);

-- Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pipelines" ON pipelines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create pipelines" ON pipelines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipelines" ON pipelines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipelines" ON pipelines
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pipelines;

-- Update trigger
CREATE TRIGGER pipeline_updated
  BEFORE UPDATE ON pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();