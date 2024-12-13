import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local if it exists
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables. Please check your .env.local file');
    console.log('Required variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.log('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function uploadDefaultModel() {
    try {
        // Read the GLB file
        const modelPath = join(dirname(__dirname), 'assets', 'woman-head.glb');
        console.log('Looking for model at:', modelPath);

        const modelFile = readFileSync(modelPath);
        console.log('Model file read successfully');

        // Upload to default-assets bucket
        const { data, error } = await supabase.storage
            .from('default-assets')
            .upload('default-model.glb', modelFile, {
                contentType: 'model/gltf-binary',
                upsert: true
            });

        if (error) throw error;
        console.log('Default model uploaded successfully:', data);

    } catch (error) {
        console.error('Error uploading default model:', error);
        process.exit(1);
    }
}

uploadDefaultModel(); 