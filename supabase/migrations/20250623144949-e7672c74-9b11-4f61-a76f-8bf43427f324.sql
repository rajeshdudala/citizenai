
-- Create a table to store email verification codes
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  is_verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Add index for efficient lookups
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_code ON public.email_verifications(verification_code);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access (since this is for unauthenticated users)
CREATE POLICY "Allow public access to email verifications" 
  ON public.email_verifications 
  FOR ALL 
  USING (true);
