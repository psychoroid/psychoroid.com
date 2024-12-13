-- Create function to update subscription type based on transactions
CREATE OR REPLACE FUNCTION update_subscription_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'subscription' THEN
        UPDATE user_roids
        SET subscription_type = 
            CASE 
                WHEN NEW.description LIKE '%automate%' THEN 'automate'
                WHEN NEW.description LIKE '%scale%' THEN 'scale'
                WHEN NEW.description LIKE '%enterprise%' THEN 'enterprise'
                ELSE 'free'
            END
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Create trigger for subscription updates
CREATE TRIGGER update_subscription_type_trigger
    AFTER INSERT ON roids_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_type(); 