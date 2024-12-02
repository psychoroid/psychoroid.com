-- Function to get a user's uploaded images
CREATE OR REPLACE FUNCTION public.get_user_uploads(p_user_id UUID)
RETURNS TABLE (
  image_path TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT p.image_path
  FROM products p
  WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 