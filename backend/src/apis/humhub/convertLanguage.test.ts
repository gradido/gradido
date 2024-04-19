import { convertGradidoLanguageToHumhub, convertHumhubLanguageToGradido } from './convertLanguage'

describe('convertGradidoLanguageToHumhub', () => {
  it('Should convert "en" to "en-US"', () => {
    const result = convertGradidoLanguageToHumhub('en')
    expect(result).toBe('en-US')
  })

  it('Should return the same language for other values', () => {
    const languages = ['de', 'fr', 'es', 'pt']
    languages.forEach((lang) => {
      const result = convertGradidoLanguageToHumhub(lang)
      expect(result).toBe(lang)
    })
  })
})

describe('convertHumhubLanguageToGradido', () => {
  it('Should convert "en-US" to "en"', () => {
    const result = convertHumhubLanguageToGradido('en-US')
    expect(result).toBe('en')
  })

  it('Should return the same language for other values', () => {
    const languages = ['de', 'fr', 'es', 'pt']
    languages.forEach((lang) => {
      const result = convertHumhubLanguageToGradido(lang)
      expect(result).toBe(lang)
    })
  })
})
