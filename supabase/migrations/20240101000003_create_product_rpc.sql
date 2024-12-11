-- Function to create a product record
CREATE OR REPLACE FUNCTION public.create_product(
  p_name TEXT,
  p_description TEXT,
  p_image_path TEXT,
  p_model_path TEXT,
  p_user_id UUID
)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  INSERT INTO products (name, description, image_path, model_path, user_id)
  VALUES (p_name, p_description, p_image_path, p_model_path, p_user_id)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 

GRANT EXECUTE ON FUNCTION create_product(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated; 