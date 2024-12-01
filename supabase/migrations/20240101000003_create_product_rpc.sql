-- Function to create a product record
CREATE OR REPLACE FUNCTION public.create_product(
  p_name TEXT,
  p_description TEXT,
  p_image_path TEXT
)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  INSERT INTO products (name, description, image_path)
  VALUES (p_name, p_description, p_image_path)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 