-- Add profile_360_url column to actors table
ALTER TABLE actors 
ADD COLUMN IF NOT EXISTS profile_360_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN actors.profile_360_url IS 'Full 360-degree profile grid image URL';
COMMENT ON COLUMN actors.profile_image_url IS 'Front-facing profile thumbnail URL';