-- Function to update merchant avatar
CREATE OR REPLACE FUNCTION public.update_merchant_avatar(
    p_merchant_id UUID,
    p_avatar_url TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE merchants
    SET 
        avatar_url = p_avatar_url,
        updated_at = NOW()
    WHERE 
        merchant_id = p_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function to update organization logo
CREATE OR REPLACE FUNCTION public.update_organization_logo(
    p_organization_id UUID,
    p_logo_url VARCHAR
)
RETURNS VOID AS $$
BEGIN
    UPDATE organizations
    SET 
        logo_url = p_logo_url,
        updated_at = NOW()
    WHERE 
        organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
