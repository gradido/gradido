/**
 * convert gradido language in valid humhub language
 * humhub doesn't know en for example, only en-US and en-GB
 * @param gradidoLanguage
 */
export function convertGradidoLanguageToHumhub(gradidoLanguage: string): string {
  if (gradidoLanguage === 'en') {
    return 'en-US'
  }
  return gradidoLanguage
}

export function convertHumhubLanguageToGradido(humhubLanguage: string): string {
  if (humhubLanguage === 'en-US') {
    return 'en'
  }
  return humhubLanguage
}
