-- MODULAR SCHEMA: Update Profiles to handle Backup VPAs

-- Adding backup_vpa to profiles to handle network downtime
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS backup_vpa TEXT,
ADD COLUMN IF NOT EXISTS active_vpa_type TEXT DEFAULT 'primary' CHECK (active_vpa_type IN ('primary', 'backup'));

-- Purpose: This allows the Shop Owner to toggle between two different UPI IDs 
-- (e.g., GPay vs PhonePe) directly from their UI if one bank's server is down.
