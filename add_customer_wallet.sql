-- Execute this in the Supabase SQL Editor to add wallet_balance to users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
