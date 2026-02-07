-- MODULAR SCHEMA: Storage & File Security

-- 1. Create the 'documents' bucket for PDFs
-- Note: 'storage' schema is managed by Supabase, we insert into the buckets table.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'documents', 
    'documents', 
    false, 
    10485760, -- 10MB limit per PDF
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
-- Enable RLS on storage.objects (standard Supabase practice)
-- Note: We use 'auth.uid()' to ensure only the uploader or the shop owner can access the file.

-- Policy: Allow authenticated users to upload to the 'documents' bucket
CREATE POLICY "Users can upload documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'documents');

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'documents' AND 
    (
        auth.uid() = owner OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'developer')
        )
    )
);

-- Policy: Auto-deletion logic (Handled by app, but we ensure DELETE is allowed)
CREATE POLICY "Users can delete their own documents" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- 3. Shop Owner can also delete documents after handover
CREATE POLICY "Owner can delete any document" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'documents' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'developer')
    )
);
