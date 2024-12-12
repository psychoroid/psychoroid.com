-- Automatically updates the updated_at timestamp on record modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Cleans up associated image files when a support request is deleted
CREATE OR REPLACE FUNCTION delete_support_request_image()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.image_path IS NOT NULL THEN
        PERFORM delete_storage_object_from_bucket('support-request-images', OLD.image_path);
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger: Deletes image from storage when support request is removed
CREATE TRIGGER cleanup_support_request_image
    BEFORE DELETE ON support_requests
    FOR EACH ROW
    EXECUTE FUNCTION delete_support_request_image();

-- Timestamp triggers for various tables
-- Products table timestamp management
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- User ROIDs table timestamp management
CREATE TRIGGER handle_user_roids_updated_at
    BEFORE UPDATE ON user_roids
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ROIDs transactions table timestamp management
CREATE TRIGGER handle_roids_transactions_updated_at
    BEFORE UPDATE ON roids_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Support requests table timestamp management
CREATE TRIGGER handle_support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Feedback table timestamp management
CREATE TRIGGER handle_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Creates a user profile automatically when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger: Auto-creates profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 