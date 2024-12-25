import { HfInference } from '@huggingface/inference'
import { NextResponse } from 'next/server'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Language codes mapping for mBART model
const MBART_LANG_CODES: Record<string, string> = {
  en: 'en_XX',
  fr: 'fr_XX',
  es: 'es_XX',
  ja: 'ja_XX',
  ko: 'ko_KR',
  pt: 'pt_XX',
  zh: 'zh_CN',
}

interface MBartTranslationParams {
  model: string
  inputs: string
  parameters: {
    src_lang: string
    tgt_lang: string
  }
}

export async function POST(request: Request) {
  try {
    const { text, sourceLang } = await request.json()

    if (!text || !sourceLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const translationParams: MBartTranslationParams = {
      model: 'facebook/mbart-large-50-many-to-many-mmt',
      inputs: text,
      parameters: {
        src_lang: MBART_LANG_CODES[sourceLang],
        tgt_lang: MBART_LANG_CODES['en']
      }
    }

    // Use type assertion since the HF types are incomplete
    const result = await hf.translation(translationParams as any)
    const translation = Array.isArray(result) ? result[0].translation_text : result.translation_text

    return NextResponse.json({ translation })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
} 