// Adjectives for random name generation
const ADJECTIVES = [
    'cosmic', 'epic', 'mega', 'ultra', 'hyper',
    'neo', 'cyber', 'retro', 'quantum', 'turbo',
    'super', 'prime', 'alpha', 'omega', 'zen',
    'cool', 'rad', 'epic', 'pro', 'elite'
];

// Nouns for random name generation
const NOUNS = [
    'mesh', 'model', 'asset', 'prop', 'item',
    'gear', 'thing', 'piece', 'craft', 'build',
    'work', 'art', 'form', 'shape', 'design'
];

// Base tags for 3D models (one will be randomly selected)
const BASE_TAGS = [
    '3d', 'mesh', 'model', 'asset'
];

// Style tags that might apply to 3D models
const STYLE_TAGS = [
    'geometric', 'organic', 'abstract', 'minimal',
    'detailed', 'modern', 'classic', 'futuristic',
    'artistic', 'technical', 'decorative', 'functional'
];

/**
 * Generates a random name for an asset
 * @returns string in format "adjective-noun" or similar variations
 */
export function generateAssetName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    
    const style = Math.random();
    
    if (style < 0.3) {
        // camelCase: cosmicMesh
        return `${adjective.toLowerCase()}${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
    } else if (style < 0.6) {
        // hyphenated: cosmic-mesh
        return `${adjective.toLowerCase()}-${noun.toLowerCase()}`;
    } else {
        // PascalCase: CosmicMesh
        return `${adjective.charAt(0).toUpperCase()}${adjective.slice(1)}${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
    }
}

/**
 * Generates an array of relevant tags for a 3D model
 * @returns string[] Array of 2 tags
 */
export function generateAssetTags(): string[] {
    // Get one random base tag
    const baseTag = BASE_TAGS[Math.floor(Math.random() * BASE_TAGS.length)];
    
    // Get one random style tag
    const styleTag = STYLE_TAGS[Math.floor(Math.random() * STYLE_TAGS.length)];
    
    return [baseTag, styleTag];
}

/**
 * Generates both a name and tags for a new asset
 * @returns Object containing name and tags
 */
export function generateAssetMetadata() {
    return {
        name: generateAssetName(),
        tags: generateAssetTags()
    };
} 