
-- Enable RLS on CAD tables
ALTER TABLE cad_model_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_operations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for CAD models
CREATE POLICY "Users can view their own CAD models"
    ON cad_models
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CAD models"
    ON cad_models
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for CAD operations
CREATE POLICY "Users can view their own CAD operations"
    ON cad_operations
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM cad_models cm
        WHERE cm.id = cad_operations.model_id
        AND cm.user_id = auth.uid()
    ));

CREATE POLICY "Users can create CAD operations on their models"
    ON cad_operations
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM cad_models cm
        WHERE cm.id = cad_operations.model_id
        AND cm.user_id = auth.uid()
    ));

-- Create function to update CAD model status
CREATE OR REPLACE FUNCTION update_cad_model_status(
    p_model_id TEXT,
    p_status cad_model_status,
    p_model_path TEXT DEFAULT NULL,
    p_preview_path TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS cad_model_tracking
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tracking cad_model_tracking;
BEGIN
    UPDATE cad_model_tracking
    SET 
        status = p_status,
        model_path = COALESCE(p_model_path, model_path),
        preview_path = COALESCE(p_preview_path, preview_path),
        error_message = COALESCE(p_error_message, error_message),
        metadata = COALESCE(p_metadata, metadata),
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed') THEN now()
            ELSE completed_at
        END,
        processing_time = CASE 
            WHEN p_status IN ('completed', 'failed') THEN now() - started_at
            ELSE processing_time
        END,
        updated_at = now()
    WHERE model_id = p_model_id
    RETURNING * INTO v_tracking;

    RETURN v_tracking;
END;
$$;

-- Create function to create new CAD model tracking entry
CREATE OR REPLACE FUNCTION create_cad_model_tracking(
    p_user_id UUID,
    p_model_id TEXT,
    p_original_prompt TEXT,
    p_enhanced_prompt TEXT DEFAULT NULL,
    p_format cad_model_format DEFAULT 'glb',
    p_parameters JSONB DEFAULT '{}'::jsonb
)
RETURNS cad_model_tracking
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tracking cad_model_tracking;
BEGIN
    INSERT INTO cad_model_tracking (
        user_id,
        model_id,
        original_prompt,
        enhanced_prompt,
        format,
        parameters
    )
    VALUES (
        p_user_id,
        p_model_id,
        p_original_prompt,
        p_enhanced_prompt,
        p_format,
        p_parameters
    )
    RETURNING * INTO v_tracking;

    RETURN v_tracking;
END;
$$;

-- Create function to get CAD model tracking details
CREATE OR REPLACE FUNCTION get_cad_model_tracking(
    p_model_id TEXT
)
RETURNS cad_model_tracking
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tracking cad_model_tracking;
BEGIN
    SELECT *
    INTO v_tracking
    FROM cad_model_tracking
    WHERE model_id = p_model_id;

    RETURN v_tracking;
END;
$$;

-- Create bucket for CAD models if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('cad-models', 'cad-models')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for CAD models bucket
CREATE POLICY "Authenticated users can upload CAD models"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'cad-models' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own CAD models"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'cad-models' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own CAD models"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'cad-models' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own CAD models"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'cad-models' AND
        auth.uid()::text = (storage.foldername(name))[1]
    ); 