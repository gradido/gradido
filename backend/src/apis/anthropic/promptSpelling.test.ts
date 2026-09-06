// AI-GENERATED — not an architecture reference
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Crea writes German that members and moderators read. What she writes, she copies from
 * what she is shown.
 *
 * `crea/ruleset.ts` has told her since long before this file that the ASCII fold is
 * forbidden — `SPELLING`, embedded in both system prompts, spells out "für" statt "fuer".
 * She wrote "fuer" anyway, in the first creation every single time: the TASK block sitting
 * next to the generation point was folded, and it showed her three examples of the wanted
 * OUTPUT in the fold. A worked example beside the answer beats a rule in a long prefix.
 *
 * ⛔ So the rule alone does not hold this. Nothing does except not contradicting it, and
 * that is what this test guards — for the whole class, not for the words that were wrong
 * on 06.09.2026.
 *
 * ⚠️ Only the German PROSE that goes to the model. Not code, not comments — the repo keeps
 * those ASCII on purpose, and that rule stays.
 */

/** Read as source rather than imported: the check is about the text, not about a call. */
const FILES = [
  // The moderation task blocks. Their output reaches a member through a moderator, who
  // would otherwise be correcting spelling by hand on every reply.
  'AnthropicClient.ts',
  // The first creation. Here NOBODY stands in between: the line goes into the message, the
  // contribution thread and the mail exactly as the model wrote it.
  'crea/firstCreation.ts',
]

/*
 * ⛔ Two files are deliberately NOT in that list, and neither omission is laziness:
 *
 * `crea/ruleset.ts` is where the rule lives, and a rule against the fold has to QUOTE the
 * fold — 'Verwende NIEMALS die Ersatzschreibweise ae/oe/ue/ss — also "für" statt "fuer"'.
 * Scanning it would fail on the one sentence that fixes the problem.
 *
 * `matching/instruction.ts` names the JSON keys the model must answer with, and two of them
 * ARE folded: `taetigkeit` and `schluessel`, read straight off the answer in
 * `keyedFields.ts` (`record.schluessel`). "Correcting" those would leave the parser reading
 * undefined, with nothing red anywhere — the matching would just quietly find less.
 */

/** The folds that stand for a German umlaut. Plain words, never stems: a stem replacement
 *  turns `Monatssumme` into nonsense and `dass` into `daß`. */
const FOLDED = [
  'fuer',
  'Fuer',
  'ueber',
  'Ueber',
  'Beitraege',
  'Beitraegen',
  'Eintraege',
  'Eintraegen',
  'Saetze',
  'Faellt',
  'faellt',
  'wuerdigt',
  'fuellt',
  'Grussformel',
  'abschliessen',
  'Ausloeser',
  'Oeffnen',
  'unveraendert',
  'vervollstaendigt',
  'bestaetigt',
  'woertlich',
  'erwaehnt',
  'Oberflaechen',
  'hoechstens',
  'Maedchen',
  'aehnliche',
  'aehnlich',
  'enthaelt',
  'Schoepfung',
  'schoen',
  'gruessen',
  'moeglich',
  'naechste',
  'waehlen',
  'erklaeren',
  'Gruende',
  'Laenge',
  'spaeter',
  'taeglich',
]
const FOLDED_WORD = new RegExp(`\\b(${FOLDED.join('|')})\\b`)

const LITERAL = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g
/** `${...}` is code inside a template literal and is masked out before the check. */
const INTERPOLATION = /\$\{[^}]*\}/g

/** Every string literal of a file, minus comments and minus the interpolations. */
function promptStrings(relative: string): { line: number; text: string }[] {
  const source = readFileSync(join(__dirname, relative), 'utf8')
  const found: { line: number; text: string }[] = []
  source.split('\n').forEach((line, index) => {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return
    }
    for (const literal of line.match(LITERAL) ?? []) {
      found.push({ line: index + 1, text: literal.replace(INTERPOLATION, ' ') })
    }
  })
  return found
}

describe('the German Crea is shown', () => {
  it.each(FILES)('%s carries no ASCII fold in anything sent to the model', (file) => {
    const offenders = promptStrings(file)
      .filter((entry) => FOLDED_WORD.test(entry.text))
      .map((entry) => `${file}:${entry.line}  ${entry.text.slice(0, 120)}`)

    expect(offenders).toEqual([])
  })

  /**
   * The check proving itself. Without this the assertion above passes just as happily when
   * `promptStrings` returns nothing at all — a green light for a file it never opened.
   */
  it('finds a fold when there is one, and reads real text to look at', () => {
    expect(FOLDED_WORD.test(`'- Schreibe NUR den Vorschlag fuer diese Entscheidung'`)).toBe(true)
    expect(FOLDED_WORD.test(`'- Schreibe NUR den Vorschlag für diese Entscheidung'`)).toBe(false)
    // ⚠️ Genuine German double-s and the folded field names must NOT trip it.
    expect(FOLDED_WORD.test(`'Monatssumme, dass, muss, dieser Prozess'`)).toBe(false)

    FILES.forEach((file) => expect(promptStrings(file).length).toBeGreaterThan(10))
  })

  /**
   * ⛔ The rule the fold was contradicting. It has to keep reaching the model, or the guard
   * above only holds the files somebody remembered to list.
   */
  it('still tells Crea the rule, in both system prompts', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildCreaSystemPrompt, buildCreaChatSystemPrompt } = require('./crea/ruleset')
    for (const prompt of [buildCreaSystemPrompt(), buildCreaChatSystemPrompt()]) {
      expect(prompt).toContain('Verwende NIEMALS die Ersatzschreibweise')
      expect(prompt).toContain('"für" statt "fuer"')
    }
  })
})
