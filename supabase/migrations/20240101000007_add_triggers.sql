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

-- Function to generate a username from the username generator results
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'magnificent', 'distinguished', 'awesome', 'brilliant', 'cosmic',
        'legendary', 'mysterious', 'noble', 'radiant', 'spectacular',
        'majestic', 'fantastic', 'incredible', 'supreme', 'stellar',
        'mighty', 'epic', 'grand', 'heroic', 'phenomenal', 'space',
        'esteemed', 'exceptional', 'preferred', 'honored', 'respected',
        'prestigious', 'elite', 'premium', 'distinguished',
        'glorious', 'illustrious', 'eminent', 'notable', 'venerable',
        'jazzy', 'fancy', 'super', 'ultra', 'mega', 'hyper', 'turbo',
        'cool', 'amazing', 'fabulous', 'marvelous', 'splendid',
        'dazzling', 'sparkly', 'shiny', 'glittering',
        'unstoppable', 'unbeatable', 'invincible', 'ultimate', 'undisputed',
        'unmatched', 'undefeated', 'unrivaled', 'unparalleled',
        'quantum', 'cyber', 'digital', 'techno', 'neo',
        'power', 'prime', 'alpha', 'omega', 'ultra'
    ];
    nouns TEXT[] := ARRAY[
        'user', 'master', 'phoenix', 'dragon', 'sage', 'pioneer',
        'titan', 'explorer', 'genius', 'adventurer',
        'goat', 'boss', 'chief', 'captain', 'hero',
        'bigdawg', 'broski', 'client', 'patron', 'anon',
        'member', 'customer', 'vip', 'ace', 'maestro', 'A-player',
        'sovereign', 'mogul', 'hotshot', 'rockstar',
        'unicorn', 'dinosaur', 'panda', 'penguin', 'raccoon',
        'samurai', 'viking', 'pirate', 'astronaut', 'adventurer',
        'superstar', 'maverick', 'prodigy', 'virtuoso',
        'sensei', 'guru', 'jedi', 'ninja', 'warrior',
        'beast', 'machine', 'robot', 'cyborg', 'android',
        'legend', 'champion', 'winner',
        'wizard', 'sorcerer', 'mage', 'alchemist',
        'pogchamp', 'memelord', 'kingpin', 'chad',
        'gigachad', 'megamind', 'bigbrain', 'mastermind'
    ];
    prefixes TEXT[] := ARRAY[
        'the', 'dr', 'prof',
        'sir', 'lord'
    ];
    suffixes TEXT[] := ARRAY[
        'oftheuniverse', 'supreme', 'prime', 'elite', 'pro',
        'master', 'expert', 'guru', 'wizard', 'sage', 'cobra',
        'legend', 'goat', 'boss', 'king', 'queen', 'of-the-world', 
        'of-the-universe', 'of-the-galaxy', 'of-the-multiverse', '-san'
    ];
    v_adjective TEXT;
    v_noun TEXT;
    v_number TEXT;
    v_prefix TEXT;
    v_suffix TEXT;
    v_style INTEGER;
    v_use_prefix BOOLEAN;
    v_use_suffix BOOLEAN;
    v_result TEXT;
BEGIN
    -- Get random words
    v_adjective := adjectives[floor(random() * array_length(adjectives, 1)) + 1];
    v_noun := nouns[floor(random() * array_length(nouns, 1)) + 1];
    v_number := CASE WHEN random() > 0.5 THEN floor(random() * 999 + 1)::TEXT ELSE '' END;
    
    -- 20% chance for prefix and suffix
    v_use_prefix := random() < 0.2;
    v_use_suffix := random() < 0.2;
    
    IF v_use_prefix THEN
        v_prefix := prefixes[floor(random() * array_length(prefixes, 1)) + 1];
    END IF;
    
    IF v_use_suffix THEN
        v_suffix := suffixes[floor(random() * array_length(suffixes, 1)) + 1];
    END IF;

    -- Random style (matching TypeScript version probabilities)
    v_style := CASE 
        WHEN random() < 0.7 THEN 1  -- Basic style (70% chance)
        WHEN random() < 0.8 AND v_use_prefix THEN 3  -- Prefix style (10% chance)
        WHEN random() < 0.9 AND v_use_suffix THEN 4  -- Suffix style (10% chance)
        ELSE 5  -- Complex style (10% chance)
    END;

    -- Generate username based on style
    v_result := CASE v_style
        WHEN 1 THEN  -- Basic style (single underscore)
            LOWER(v_adjective) || '_' || LOWER(v_noun) || 
            CASE WHEN v_number != '' THEN '_' || v_number ELSE '' END
            
        WHEN 3 THEN  -- Prefix style with underscore
            LOWER(v_prefix) || '_' || LOWER(v_adjective) || '_' || LOWER(v_noun)
            
        WHEN 4 THEN  -- Suffix style with underscore
            LOWER(v_adjective) || '_' || LOWER(v_noun) || '_' || 
            CASE WHEN LENGTH(v_suffix) + LENGTH(v_adjective) + LENGTH(v_noun) <= 31 
                THEN v_suffix ELSE 'pro' END ||
            CASE WHEN v_number != '' THEN '_' || v_number ELSE '' END
            
        ELSE  -- Complex style with underscore
            LOWER(v_adjective) || '_' || LOWER(v_noun) || 
            CASE WHEN LENGTH(v_suffix) + LENGTH(v_adjective) + LENGTH(v_noun) <= 31 
                THEN '_' || v_suffix ELSE '' END ||
            CASE WHEN v_number != '' THEN '_' || v_number ELSE '' END
    END;

    -- Ensure final length is within limits
    IF LENGTH(v_result) > 35 THEN
        -- Fallback to simpler style if too long
        v_result := LOWER(v_adjective) || '_' || LOWER(v_noun) || 
            CASE WHEN random() > 0.5 THEN floor(random() * 99 + 1)::TEXT ELSE '' END;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Modify generate_unique_username to use the random generator
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
    new_username TEXT;
    counter INTEGER := 1;
BEGIN
    -- First try with the base username
    new_username := base_username;
    
    -- If base username is taken, try with a random one
    IF EXISTS (SELECT 1 FROM profiles WHERE username = new_username) THEN
        new_username := generate_random_username();
    END IF;
    
    -- Keep trying until we find a unique username
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
        new_username := generate_random_username();
        counter := counter + 1;
        IF counter > 10 THEN
            -- Fallback to base_username with number if we can't find a unique random one
            new_username := base_username || counter::TEXT;
        END IF;
    END LOOP;
    
    RETURN new_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger to ensure username uniqueness
CREATE OR REPLACE FUNCTION ensure_unique_username()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.username IS NULL OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE username = NEW.username 
        AND id != NEW.id
    ) THEN
        NEW.username := generate_unique_username(NEW.username);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger: Ensures username uniqueness
DROP TRIGGER IF EXISTS ensure_unique_username_trigger ON profiles;
CREATE TRIGGER ensure_unique_username_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_unique_username(); 