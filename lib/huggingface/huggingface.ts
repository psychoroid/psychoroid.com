import { HfInference } from '@huggingface/inference'

// Initialize HF client only on the server side
const isServer = typeof window === 'undefined'
const apiKey = isServer ? process.env.HUGGINGFACE_API_KEY : undefined

// Initialize with a warning if no API key is found
export const hf = apiKey 
  ? new HfInference(apiKey)
  : null

if (!apiKey) {
  console.warn('HUGGINGFACE_API_KEY not found in environment variables. Translation features will be disabled.')
}

// Export available models
export const AVAILABLE_MODELS = {
  'ldm3d': 'Intel/ldm3d',
  'zero123': 'stabilityai/stable-zero123',
  'hunyuan3d': 'tencent/Hunyuan3D-1',
  'crm': 'Zhengyi/CRM'
} 