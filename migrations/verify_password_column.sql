-- Verify password column exists
-- Run this in Supabase SQL Editor to check

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'password';

-- If this returns no rows, the column doesn't exist
-- If it returns a row, the column exists

