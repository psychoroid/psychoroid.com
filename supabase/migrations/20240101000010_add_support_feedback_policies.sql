-- Support requests policies
CREATE POLICY "Users can view their own support requests"
    ON support_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create support requests"
    ON support_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view their own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id); 