-- Create a function to handle ROIDS deduction
CREATE OR REPLACE FUNCTION handle_product_roids_deduction()
RETURNS TRIGGER AS $$
DECLARE
    current_balance INTEGER;
    required_roids CONSTANT INTEGER := 25;
BEGIN
    -- Get current ROIDS balance
    SELECT balance INTO current_balance
    FROM user_roids
    WHERE user_id = NEW.user_id;

    -- Check if user has enough ROIDS
    IF current_balance IS NULL OR current_balance < required_roids THEN
        RAISE EXCEPTION 'Insufficient ROIDS balance. Required: %, Current: %', required_roids, COALESCE(current_balance, 0);
    END IF;

    -- Deduct ROIDS and create transaction record
    UPDATE user_roids
    SET balance = balance - required_roids,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- Record the transaction
    INSERT INTO roids_transactions (
        user_id,
        amount,
        transaction_type,
        product_id,
        description
    ) VALUES (
        NEW.user_id,
        -required_roids,
        'usage',
        NEW.id,
        'Model generation cost'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER product_roids_deduction_insert_trigger
    AFTER INSERT ON products
    FOR EACH ROW
    WHEN (NEW.model_path IS NOT NULL)
    EXECUTE FUNCTION handle_product_roids_deduction();

-- Create trigger for UPDATE operations
CREATE TRIGGER product_roids_deduction_update_trigger
    AFTER UPDATE OF model_path ON products
    FOR EACH ROW
    WHEN (
        NEW.model_path IS NOT NULL AND 
        (OLD.model_path IS NULL OR OLD.model_path IS DISTINCT FROM NEW.model_path)
    )
    EXECUTE FUNCTION handle_product_roids_deduction(); 