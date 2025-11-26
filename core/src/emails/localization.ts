import en from './locales/en.json'
import de from './locales/de.json'
import { I18n } from 'i18n'

function flatten(obj: any, prefix: string = ''): any {
  const result: any = {}
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flatten(obj[key], prefix + key + '.'))
    } else {
      result[prefix + key] = obj[key]
    }
  }
  return result
}

export const i18n = new I18n({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  staticCatalog: { en: flatten(en), de: flatten(de) },
  api: {
    __: 't', // now req.__ becomes req.t
    __n: 'tn', // and req.__n can be called as req.tn
  },
  register: global,
  mustacheConfig: {
    tags: ['{', '}'],
    disable: false,
  },
})

