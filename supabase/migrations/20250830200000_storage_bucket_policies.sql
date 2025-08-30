/*
  Storage Bucket RLS Policies
  
  This migration adds proper Row Level Security policies for storage buckets:
  - racer-photos: For racer profile photos, banner images, and car photos
  - postimage: For post images and videos uploaded by users
  
  1. Create buckets if they don't exist
  2. Enable RLS on buckets
  3. Add policies for authenticated users to upload to their own folders
  4. Add policies for public read access to all files
*/

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('racer-photos', 'racer-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('postimage', 'postimage', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on buckets
UPDATE storage.buckets SET public = false WHERE id = 'racer-photos';
UPDATE storage.buckets SET public = false WHERE id = 'postimage';

-- Add RLS policies for racer-photos bucket
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'racer-photos' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'racer-photos' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'racer-photos' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Add RLS policies for postimage bucket
DROP POLICY IF EXISTS "Users can upload to their own post folder" ON storage.objects;
CREATE POLICY "Users can upload to their own post folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'postimage' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users can update their own post files" ON storage.objects;
CREATE POLICY "Users can update their own post files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'postimage' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users can delete their own post files" ON storage.objects;
CREATE POLICY "Users can delete their own post files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'postimage' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Add public read access to all files
DROP POLICY IF EXISTS "Anyone can read all files" ON storage.objects;
CREATE POLICY "Anyone can read all files"
ON storage.objects FOR SELECT
TO public
USING (true);
