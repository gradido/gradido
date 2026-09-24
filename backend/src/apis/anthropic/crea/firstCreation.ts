// AI-GENERATED — not an architecture reference
import { DomainError, Result } from 'shared'

// The first creation's share of Crea (ES-001/ES-006/ES-007): the model writes ONE line of
// thanks per entry and may raise its hand. It never decides — the decision "confirm" is a
// rule in code (AGENTS.md, pillar 3), and what the model hands back is text plus a flag
// that a HUMAN should look first.

/**
 * How long one first-creation call may take before the process moves on without the
 * model (ES-019). A request option on this one call, not a client setting: the admin's
 * Crea keeps the library default (ten minutes, two retries).
 */
export const FIRST_CREATION_TIMEOUT_MS = 60_000

/** Longest line of thanks the message accepts; anything longer fails the form check. */
export const FIRST_CREATION_LINE_MAX_CHARS = 200

/** One entry as the model sees it: the finished sentence, nothing about the person. */
export interface FirstCreationModelEntry {
  memo: string
}

/** What the model answered, after the form check. `lines[i]` belongs to `entries[i]`. */
export interface FirstCreationAnswer {
  lines: string[]
  suspicious: boolean
  reason: string
}

/**
 * The shape the model is constrained to (`output_config.format`, like CREA_BATCH_SCHEMA).
 * `reason` is a required string that stays empty when nothing is suspicious: the API
 * accepts neither `nullable` nor bounds on this endpoint.
 */
export const FIRST_CREATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          entryIndex: { type: 'integer' },
          text: { type: 'string' },
        },
        required: ['entryIndex', 'text'],
      },
    },
    suspicious: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['lines', 'suspicious', 'reason'],
} as const

/**
 * How the member is addressed and how a line of thanks opens, in each language the window
 * speaks (the ten of the wallet). A line is set behind that language's own "Die
 * Gemeinschaft dankt Dir —" (core, `firstCreation.message.thanks`), so its first words
 * have to continue exactly that sentence.
 *
 * ⚠️ Russian is addressed formally, like the whole Russian wallet: "вы" is the unmarked
 * form towards an adult there, and its past tense needs no gender. Turkish puts its "for"
 * at the END of the line ("... için").
 */
export const FIRST_CREATION_LINE_FORMS: Readonly<
  Record<string, { address: string; opening: string }>
> = {
  de: { address: 'in der zweiten Person (Du)', opening: 'sie beginnt mit "für ..."' },
  en: { address: 'in der zweiten Person (you)', opening: 'sie beginnt mit "for ..."' },
  el: { address: 'in der zweiten Person Singular (εσύ)', opening: 'sie beginnt mit "για ..."' },
  es: { address: 'in der zweiten Person Singular (tú)', opening: 'sie beginnt mit "por ..."' },
  fr: { address: 'in der zweiten Person Singular (tu)', opening: 'sie beginnt mit "pour ..."' },
  it: { address: 'in der zweiten Person Singular (tu)', opening: 'sie beginnt mit "per ..."' },
  nl: { address: 'in der zweiten Person Singular (je)', opening: 'sie beginnt mit "voor ..."' },
  pt: {
    address: 'in der zweiten Person Singular (tu), europäisches Portugiesisch',
    opening: 'sie beginnt mit "por ..."',
  },
  ru: {
    address: 'in der Höflichkeitsform (вы, klein geschrieben)',
    opening: 'sie beginnt mit "за ..."',
  },
  tr: { address: 'in der zweiten Person Singular (sen)', opening: 'sie endet mit "... için"' },
}

/**
 * For a language outside the ten. None reaches the model today — without a catalog the
 * window stays shut — but the task must still read sensibly if one ever did.
 */
const FALLBACK_LINE_FORM = {
  address: 'in der zweiten Person (Du)',
  opening: 'sie beginnt so, wie in dieser Sprache ein Dank "für ..." anschließt',
}

/**
 * The first-creation task, as the USER block of the request. The system prompt stays
 * `buildCreaSystemPrompt()` byte for byte, so this call shares the moderation Crea's
 * prompt cache (ES-007); everything the first creation adds lives here.
 *
 * Carries the finished sentences and the language - no first name, no alias, no address
 * (E-012): the salutation is built locally from a locale key.
 */
export function buildFirstCreationUserMessage(
  entries: FirstCreationModelEntry[],
  language: string,
): string {
  const form = FIRST_CREATION_LINE_FORMS[language] ?? FALLBACK_LINE_FORM
  const lines: string[] = [
    '## Aufgabe: Erst-Schöpfung (Dank-Zeilen)',
    'Ein neues Mitglied hat beim ersten Öffnen seines Kontos die folgenden Sätze vervollständigt. Das Urteil steht fest: alle Beiträge werden bestätigt. Du bewertest NICHT und empfiehlst NICHT.',
    '',
    'Schreibe zu JEDEM Eintrag genau EINE Dank-Zeile:',
    `- in der Sprache "${language}", ${form.address},`,
    `- so gebaut, dass sie hinter "Die Gemeinschaft dankt Dir -" in dieser Sprache passt: ${form.opening},`,
    '- ohne Wortformen, die ein Geschlecht des Mitglieds festlegen: es ist nicht bekannt und wird nicht erraten,',
    '- umformuliert, nie wörtlich zitiert, ohne Einzelheiten, die nicht im Eintrag stehen,',
    '- Rechtschreibung und Grammatik des Eintrags weder korrigiert noch erwähnt,',
    '- vorlesbar: kurze Worte, keine Oberflächen-Begriffe, kein Betrag, kein Wort für "Zahlung" (in keiner Sprache),',
    `- höchstens ${FIRST_CREATION_LINE_MAX_CHARS} Zeichen, ohne Punkt am Ende.`,
    '',
    'Beispiele (deutsch):',
    '- Eintrag "Ich habe in meiner Gemeinde mitgeholfen, indem ich Kuchen für das Gemeindefest gebacken habe" -> "für den Kuchen zum Gemeindefest"',
    '- Eintrag "Ich habe zu Hause mitgeholfen, indem ich die Pizzakartons getragen hab" -> "für die Pizzakartons, die Du getragen hast"',
    '- Eintrag "Ich habe mein Wissen weitergegeben, indem ich einem Mädchen das Wort Haus beigebracht habe" -> "für das Wort Haus"',
    '',
    'Setze "suspicious" NUR auf true, wenn ein Eintrag gesetzeswidrige, sexistische, gewaltverherrlichende, rassistische, kriegerische oder ähnliche Formulierungen enthält, und nenne dann in "reason" kurz den Grund (intern, nur für Moderatoren, deutsch). Sonst suspicious=false und reason="".',
    'Schreibe die Dank-Zeilen auch dann, wenn suspicious=true ist.',
    '',
    `## Die Einträge (${entries.length})`,
  ]
  entries.forEach((entry, index) => {
    lines.push(`### Eintrag ${index} (entryIndex ${index})`, entry.memo, '')
  })
  return lines.join('\n')
}

/** The model's answer did not have the shape that was asked for. */
export class FirstCreationAnswerMalformed extends DomainError {
  constructor(public readonly detail: string) {
    super(`FIRST_CREATION_ANSWER_MALFORMED: ${detail}`)
  }
}

/**
 * Checks the FORM of the model's answer before anything is written: exactly one line per
 * entry, indices 0..n-1 without gaps or repeats, no empty line, none longer than
 * FIRST_CREATION_LINE_MAX_CHARS, a boolean flag and a string reason. Anything else is
 * treated like a model error upstream (outcome C).
 *
 * This checks the form only. Whether a line says more than the entry said is not checked
 * by anybody - the member reads the message and the moderator can read the thread.
 */
export function checkFirstCreationAnswer(
  raw: unknown,
  expectedLines: number,
): Result<FirstCreationAnswer, FirstCreationAnswerMalformed> {
  const fail = (detail: string): Result<FirstCreationAnswer, FirstCreationAnswerMalformed> => ({
    success: false,
    error: new FirstCreationAnswerMalformed(detail),
  })
  if (!raw || typeof raw !== 'object') {
    return fail('answer is not an object')
  }
  const answer = raw as { lines?: unknown; suspicious?: unknown; reason?: unknown }
  if (!Array.isArray(answer.lines)) {
    return fail('lines is not an array')
  }
  if (answer.lines.length !== expectedLines) {
    return fail(`expected ${expectedLines} lines, got ${answer.lines.length}`)
  }
  if (typeof answer.suspicious !== 'boolean') {
    return fail('suspicious is not a boolean')
  }
  if (typeof answer.reason !== 'string') {
    return fail('reason is not a string')
  }
  const lines: string[] = new Array(expectedLines).fill('')
  const seen = new Set<number>()
  for (const item of answer.lines as unknown[]) {
    const line = item as { entryIndex?: unknown; text?: unknown }
    if (
      !line ||
      typeof line.entryIndex !== 'number' ||
      !Number.isInteger(line.entryIndex) ||
      line.entryIndex < 0 ||
      line.entryIndex >= expectedLines
    ) {
      return fail(`entryIndex out of range: ${String(line?.entryIndex)}`)
    }
    if (seen.has(line.entryIndex)) {
      return fail(`entryIndex repeated: ${line.entryIndex}`)
    }
    seen.add(line.entryIndex)
    const text = typeof line.text === 'string' ? line.text.trim() : ''
    if (text.length === 0) {
      return fail(`empty line for entry ${line.entryIndex}`)
    }
    if (text.length > FIRST_CREATION_LINE_MAX_CHARS) {
      return fail(`line for entry ${line.entryIndex} longer than ${FIRST_CREATION_LINE_MAX_CHARS}`)
    }
    lines[line.entryIndex] = text
  }
  return {
    success: true,
    value: { lines, suspicious: answer.suspicious, reason: answer.reason.trim() },
  }
}
