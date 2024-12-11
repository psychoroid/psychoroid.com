-- User_roids policies
CREATE POLICY "Users can view their own ROIDS"
    ON user_roids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ROIDS"
    ON user_roids FOR UPDATE
    USING (auth.uid() = user_id);

-- Roids_transactions policies
CREATE POLICY "Users can view their own transactions"
    ON roids_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions"
    ON roids_transactions 
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true); 