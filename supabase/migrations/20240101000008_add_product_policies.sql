-- Products policies
CREATE POLICY "Public products are viewable by everyone" 
    ON products FOR SELECT 
    USING (visibility = 'public');

CREATE POLICY "Users can view their own products" 
    ON products FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" 
    ON products FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
    ON products FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
    ON products FOR DELETE 
    USING (auth.uid() = user_id);

-- Product likes policies
CREATE POLICY "Anyone can view likes"
    ON product_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own likes"
    ON product_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes on their products"
    ON product_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_likes.product_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can like public products"
    ON product_likes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND p.visibility = 'public'
        )
    );

CREATE POLICY "Users can unlike their own likes"
    ON product_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Product downloads policies
CREATE POLICY "Anyone can view download counts"
    ON product_downloads FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can record downloads"
    ON product_downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id); 