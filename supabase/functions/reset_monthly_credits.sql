BEGIN;
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the credit reset to run daily at 00:00 UTC
SELECT cron.schedule(
    'reset-monthly-credits',  -- unique job name
    '0 0 * * *',             -- cron schedule (daily at midnight UTC)
    $$
    SELECT reset_monthly_credits();
    $$
);
COMMIT; 