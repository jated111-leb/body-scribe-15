-- Create storage bucket for health images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-images',
  'health-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS Policies for health-images bucket

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload health images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'health-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view their own health images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'health-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own health images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'health-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow dieticians to view their clients' health images
CREATE POLICY "Dieticians can view client health images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'health-images' AND
  EXISTS (
    SELECT 1 FROM public.dietician_clients
    WHERE dietician_clients.client_id::text = (storage.foldername(name))[1]
      AND dietician_clients.dietician_id = auth.uid()
      AND dietician_clients.status = 'active'
  )
);

-- Allow public access for images (since bucket is public)
CREATE POLICY "Public access to health images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'health-images');