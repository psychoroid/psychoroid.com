// Simple in-memory cache for translations
const translationCache = new Map<string, string>()
const cacheKey = (text: string, sourceLang: string) => `${sourceLang}:${text}`

type LanguageCode = 'ja' | 'zh' | 'ko' | 'fr' | 'es' | 'pt' | 'en'

// Language detection patterns
const languagePatterns: Record<Exclude<LanguageCode, 'en'>, RegExp> = {
  ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,  // Hiragana, Katakana, Kanji
  zh: /[\u4E00-\u9FFF\u3400-\u4DBF]/,  // Chinese characters
  ko: /[\uAC00-\uD7AF\u1100-\u11FF]/,  // Hangul
  fr: /[àâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ]/,  // French specific characters
  es: /[áéíóúñÁÉÍÓÚÑ¿¡üÜ]/,  // Spanish specific characters
  pt: /[áâãàéêíóôõúçÁÂÃÀÉÊÍÓÔÕÚÇ]/,  // Portuguese specific characters
}

// Detect language from text
function detectLanguage(text: string): LanguageCode {
  // First check for Asian languages as they're most distinct
  for (const lang of ['ja', 'zh', 'ko'] as const) {
    if (languagePatterns[lang].test(text)) {
      return lang
    }
  }

  // Then check for Latin-based languages
  for (const lang of ['fr', 'es', 'pt'] as const) {
    if (languagePatterns[lang].test(text)) {
      return lang
    }
  }

  // Check if the text contains mostly ASCII characters
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / text.length
  if (nonAsciiRatio < 0.1) { // If less than 10% non-ASCII, assume English
    return 'en'
  }

  return 'en'  // Default to English if no specific pattern is matched
}

export async function translateToEnglish(
  text: string,
  sourceLang: string
): Promise<string> {
  console.log('Translation request:', { text, sourceLang })

  // Detect language if not explicitly provided or if provided as 'en'
  const detectedLang = detectLanguage(text)
  const actualSourceLang = sourceLang === 'en' ? detectedLang : sourceLang

  // If text is already in English or no translation is needed, return as is
  if (actualSourceLang === 'en') {
    console.log('No translation needed:', { reason: 'English source' })
    return text
  }

  // Check cache first
  const key = cacheKey(text, actualSourceLang)
  const cached = translationCache.get(key)
  if (cached) {
    console.log('Using cached translation:', { original: text, translated: cached })
    return cached
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, sourceLang: actualSourceLang }),
    })

    if (!response.ok) {
      throw new Error('Translation request failed')
    }

    const data = await response.json()
    const translation = data.translation

    if (translation) {
      // Cache the result
      translationCache.set(key, translation)
      console.log('Translation successful:', { original: text, translated: translation })
      return translation
    }

    return text
  } catch (error) {
    console.error('Translation failed:', error)
    return text
  }
}

// Helper to detect if text needs translation (contains non-ASCII characters)
export function needsTranslation(text: string): boolean {
  // First check if we can detect a specific non-English language
  const detectedLang = detectLanguage(text)
  if (detectedLang !== 'en') {
    return true
  }
  
  // If no specific language detected, use the ASCII ratio check
  const nonAsciiCount = (text.match(/[^\x00-\x7F]/g) || []).length
  const totalLength = text.length
  const ratio = nonAsciiCount / totalLength
  
  console.log('Text analysis:', {
    text,
    detectedLang,
    nonAsciiCount,
    totalLength,
    ratio,
    needsTranslation: detectedLang !== 'en' || (nonAsciiCount > 0 && ratio > 0.2)
  })
  
  return detectedLang !== 'en' || (nonAsciiCount > 0 && ratio > 0.2)
} 