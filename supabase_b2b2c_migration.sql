-- B2B2C Marketplace Migration Script
-- Execute this in the Supabase SQL Editor

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'business_owner', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Users Table (Replaces admins)
-- Note: 'id' can reference auth.users(id) if you are strictly using Supabase Auth.
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'customer',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop old admins table if it exists
DROP TABLE IF EXISTS public.admins CASCADE;

-- 3. Update Organizations Table
ALTER TABLE public.organizations 
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS msme_certificate_url TEXT,
    ADD COLUMN IF NOT EXISTS serviceable_cities TEXT[],
    ADD COLUMN IF NOT EXISTS price_per_km NUMERIC,
    ADD COLUMN IF NOT EXISTS advance_percent NUMERIC,
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;

-- 4. Update Parcels Table
ALTER TABLE public.parcels 
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS parcel_dimensions TEXT,
    ADD COLUMN IF NOT EXISTS parcel_weight NUMERIC,
    ADD COLUMN IF NOT EXISTS parcel_type TEXT,
    ADD COLUMN IF NOT EXISTS pickup_address TEXT,
    ADD COLUMN IF NOT EXISTS escrow_locked_amount NUMERIC DEFAULT 0;

-- 5. Disable RLS for seamless MVP testing on new table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
