import { HfInference } from '@huggingface/inference'

if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Missing env.HUGGINGFACE_API_KEY')
}

export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Define the available models
export const models = [
  'Intel/ldm3d',
  'stabilityai/stable-zero123',
  'tencent/Hunyuan3D-1',
  'Zhengyi/CRM'
]; 