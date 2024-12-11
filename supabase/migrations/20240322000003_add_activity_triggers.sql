-- Add triggers for recording activities
CREATE OR REPLACE FUNCTION record_api_key_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM record_user_activity(
            NEW.user_id,
            'api_key_generated',
            jsonb_build_object('key_name', NEW.name)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'revoked' AND OLD.status = 'active' THEN
        PERFORM record_user_activity(
            NEW.user_id,
            'api_key_revoked',
            jsonb_build_object('key_name', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_api_key_change
    AFTER INSERT OR UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION record_api_key_activity();

-- Add trigger for profile updates
CREATE OR REPLACE FUNCTION record_profile_update_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        PERFORM record_user_activity(
            NEW.id,
            'profile_updated',
            jsonb_build_object(
                'updated_fields', array_to_json(
                    array(
                        SELECT key 
                        FROM jsonb_object_keys(NEW.raw_user_meta_data) AS key 
                        WHERE NEW.raw_user_meta_data->key IS DISTINCT FROM OLD.raw_user_meta_data->key
                    )
                )
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION record_profile_update_activity();

-- Add trigger for subscription changes
CREATE OR REPLACE FUNCTION record_subscription_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status 
    OR NEW.subscription_type IS DISTINCT FROM OLD.subscription_type THEN
        PERFORM record_user_activity(
            NEW.user_id,
            'subscription_updated',
            jsonb_build_object(
                'new_status', NEW.subscription_status,
                'new_type', NEW.subscription_type
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
    AFTER UPDATE ON user_roids
    FOR EACH ROW
    EXECUTE FUNCTION record_subscription_activity(); 