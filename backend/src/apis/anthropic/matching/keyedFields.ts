// AI-GENERATED — not an architecture reference
import {
  KEY_FIELD_MAX_CHARS,
  KEY_TRAIT_MAX_CHARS,
  KEY_WORD_MAX_CHARS,
  MAX_KEY_TRAITS_PER_ENTRY,
  MAX_KEY_WORDS_PER_ENTRY,
} from 'shared'
import { isKeyCategory } from '@/data/MatchingKey.enum'
import type { KeyingAnswerRecord } from './instruction'
import { normaliseKeyWord, normaliseKeyWords } from './keyWords'

/** The keyed columns of a matching entry, as they are stored and sent on. */
export interface KeyedFields {
  keyWords: string[]
  keySubject: string | null
  keyActivity: string | null
  keyCategory: string | null
  keyArea: string | null
  keyActor: string | null
  keySoughtActor: string | null
  keyTraits: string[]
}

/** What was thrown away while cleaning, so the caller can log it against its entry. */
export interface KeyedFieldsResult {
  fields: KeyedFields
  dropped: string[]
}

/**
 * Turn one record as the model answered into the columns we store.
 *
 * This is the translation point the architecture asks for: a foreign shape, with the
 * German field names the instruction speaks of, becomes our own - and it is the only
 * place that knows both. Everything downstream sees clean, bounded values.
 *
 * Cleaning rather than refusing, and the asymmetry with the GMS is deliberate. Here we
 * can see which entry an oversized or empty value came from and say so in the log; the
 * GMS sees an api key and a payload, so it refuses. A model that answers with a
 * sentence where a word belongs must not cost the member their entry - it costs that
 * one word, and the log says which.
 *
 * Three rules, each with a reason rather than a habit:
 *
 *  - key words, subject, actor and sought actor are normalised, because they go into
 *    the index and the index is compared string against string.
 *  - activity and area are only trimmed. Nothing ever compares them, so folding them
 *    would cost the spelling and buy nothing.
 *  - traits are left alone beyond trimming: they are short phrases, and normalising
 *    would turn `fuer kinder` into one unreadable word.
 */
export function keyedFieldsFromAnswer(record: KeyingAnswerRecord): KeyedFieldsResult {
  const dropped: string[] = []

  const withinBound = (values: readonly string[], max: number, what: string): string[] =>
    values.filter((value) => {
      if (value.length <= max) {
        return true
      }
      dropped.push(`${what} over ${max} characters`)
      return false
    })

  // ⛔ Measured AFTER folding, never before. Spelling out an umlaut makes a word
  // longer - `ä` becomes `ae` - so a 63-character compound with three of them is 66
  // once folded, and 66 does not fit the varchar(64) it is stored in on either side.
  // Bounding the raw word would let it through here and turn it into a database error
  // over there, on a whole batch. What is bounded is what is stored.
  const withinCount = (values: string[], max: number, what: string): string[] => {
    if (values.length <= max) {
      return values
    }
    // Said out loud, because the caller logs it against the entry. A model that
    // answered with 300 key words for one sentence has gone wrong, and the count
    // being quietly cut to 64 is the only evidence there would otherwise be.
    dropped.push(`${values.length - max} ${what}s over the ${max} an entry may carry`)
    return values.slice(0, max)
  }

  const keyWords = withinCount(
    withinBound(normaliseKeyWords(record.schluessel ?? []), KEY_WORD_MAX_CHARS, 'key word'),
    MAX_KEY_WORDS_PER_ENTRY,
    'key word',
  )

  const keyTraits = withinCount(
    Array.from(
      new Set(
        withinBound(
          (record.merkmal ?? []).map((trait) => trait.trim()).filter(Boolean),
          KEY_TRAIT_MAX_CHARS,
          'trait',
        ),
      ),
    ),
    MAX_KEY_TRAITS_PER_ENTRY,
    'trait',
  )

  // An indexed field: folded, and empty becomes null. The model answers with an empty
  // string where a field does not apply - `gesuchter_beruf` outside the 'need'
  // channel - and null is what says "nothing here" everywhere else in the system.
  const indexed = (value: string | undefined, what: string): string | null => {
    if (!value) {
      return null
    }
    // Folded first, then measured - same reason as the key words above.
    const folded = normaliseKeyWord(value)
    if (!folded) {
      return null
    }
    if (folded.length > KEY_WORD_MAX_CHARS) {
      dropped.push(`${what} over ${KEY_WORD_MAX_CHARS} characters`)
      return null
    }
    return folded
  }

  // A field nothing compares: trimmed, bounded, kept as written.
  const asWritten = (value: string | undefined, what: string): string | null => {
    const trimmed = value?.trim()
    if (!trimmed) {
      return null
    }
    if (trimmed.length > KEY_FIELD_MAX_CHARS) {
      dropped.push(`${what} over ${KEY_FIELD_MAX_CHARS} characters`)
      return null
    }
    return trimmed
  }

  // The category is a closed list of twelve and the schema already asks for one of
  // them, so an answer outside it is a model that ignored the list. Dropping it costs
  // one field; refusing the whole answer would cost the member their keying.
  const category = record.klasse?.trim()
  let keyCategory: string | null = null
  if (category) {
    if (isKeyCategory(category)) {
      keyCategory = category
    } else {
      dropped.push(`category "${category}" is not one of the twelve`)
    }
  }

  return {
    fields: {
      keyWords,
      keySubject: indexed(record.sache, 'subject'),
      keyActivity: asWritten(record.taetigkeit, 'activity'),
      keyCategory,
      keyArea: asWritten(record.gebiet, 'area'),
      keyActor: indexed(record.wer, 'actor'),
      keySoughtActor: indexed(record.gesuchter_beruf, 'sought actor'),
      keyTraits,
    },
    dropped,
  }
}
