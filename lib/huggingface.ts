import { HfInference } from '@huggingface/inference'

if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Missing env.HUGGINGFACE_API_KEY')
}

export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY) 