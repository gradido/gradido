// AI-GENERATED — not an architecture reference
import { KEY_CATEGORIES } from '@/data/MatchingKey.enum'

/**
 * Which version of the instruction below produced an entry's keying.
 *
 * Stored on every entry, and the whole point of storing it is that this instruction
 * WILL change: it is going to be improved against real entries, and without a version
 * that improvement would only ever reach entries written after it. Raise this string
 * whenever anything in `KEYING_INSTRUCTION`, `KEYING_SCHEMA` or the shape of the user
 * message below changes, and the keying run works through everything that still
 * carries an older one.
 *
 * ⚠️ A re-keying changes who matches whom. Somebody who saw twelve people light up on
 * the map yesterday may see nine today. Deliberate and rare, not by the way.
 *
 * `gms214` is the measurement this text comes from - the `gms176` text (one call per
 * entry, the profession question folded in rather than asked separately), with the
 * details added as a reading aid in three checked replacements, and a message that
 * carries them.
 */
export const KEYING_INSTRUCTION_VERSION = 'gms214-1'

/**
 * What the model is asked to do with one entry.
 *
 * ⛔ This text is not to be tidied. It is the wording that was measured over 588
 * offer/need pairs and, for the details, over 53 entries that carry some (GMS-214),
 * and the numbers the whole plan rests on - 89 % of pairs found when the two halves
 * arrive months apart - are numbers about THIS text. Any edit is a new experiment and
 * needs a new version above.
 *
 * German, and that is a decision rather than an oversight (plan decision E-1). The
 * shared vocabulary is German because German hands out the compound word instead of
 * making the model guess one: measured, a Spanish sentence about `cambio de baterías`
 * comes back as `akkutausch · akkuzelle · batteriewechsel`. English keys find just as
 * well but make nine times as much noise on an empty search. No member ever sees any
 * of this.
 *
 * ⛔ And it carries NO EXAMPLES. An example does not show the model how to answer, it
 * tells it what to answer - measured, the example's own words come back in the keys of
 * entries that have nothing to do with it.
 *
 * The two rules doing the heavy lifting:
 *
 *  - the vocabulary appendix below: if a word for this already exists, use exactly it.
 *    Without it, two members describing the same thing months apart coin two words and
 *    never meet.
 *  - the model fills `wer` even when the sentence does not name a person. That is what
 *    makes an entry findable by somebody typing a trade - which is what people type.
 *
 * The details are a reading aid: they tell the model how an ambiguous or vague
 * sentence is meant. With them, such sentences found their partner in 59 of 63 cases
 * instead of 21, and the wrong reading fell from 27 hits to 10 (GMS-214). Measured with
 * ten entries in a call; keyed one per call, as now, it has not been measured.
 *
 * ⚠️ The paragraph about them asks the model to key the SENTENCE only, and that
 * boundary does not hold - a request is not a boundary. Measured, the more precise kind
 * of thing named in the details lands in the keys anyway, and carries part of the gain;
 * other words from the details reach the keys of 59 to 68 of 159 entries, and a typed
 * search finds an entry by such a word faintly at most (stage 1 or 2). Accepted rather
 * than filtered: a word filter has not been measured. What bounds it is how much of the
 * details the model gets to read - see `KEYING_DETAILS_MAX_CHARS`.
 */
export const KEYING_INSTRUCTION = `Du arbeitest Eintraege einer Nachbarschafts-Plattform zu Suchdatensaetzen aus.
Jeder Eintrag ist ein Satz, den ein Mensch geschrieben hat, dazu ein Kanal
(bietet an / sucht / interessiert sich fuer) und meist Details, die er zu
seinem Satz dazugeschrieben hat.

Auf dieser Plattform suchen Menschen einander. Wer Hilfe braucht, tippt fast
immer die Bezeichnung des MENSCHEN, den er sucht — nicht die der Taetigkeit.

Die Details sind eine Lesehilfe. Sie zeigen dir, wie der Satz gemeint ist,
wenn er mehrdeutig ist. Alle Felder beschreiben nur die Sache des SATZES — so,
wie du ihn mit Hilfe der Details verstehst. Was nur in den Details vorkommt,
verschluesselst du nicht: weitere Dinge, Preise, Bedingungen, Orte, Zeiten,
Erlebnisse, und auch eine genauere Art der Sache.

Erzeuge je Eintrag genau einen Datensatz mit diesen Feldern:

schluessel  Alle Woerter, unter denen ein Mensch diesen Eintrag finden koennen
            soll. Hinein gehoeren:

            1. Das zusammengesetzte Wort UND jeden seiner Teile einzeln.
            2. Gelaeufige andere Woerter fuer dieselbe Sache.
            3. Die Taetigkeit.
            4. Weitere gebraeuchliche Bezeichnungen fuer DENSELBEN Beruf, falls
               es neben der in "wer" noch andere gibt. Bezeichnungen fuer
               BENACHBARTE Berufe gehoeren nicht hinein.

            Kleingeschrieben, Einzahl. Lieber ein Wort zu viel als eines zu wenig.

sache       Worum es geht. EIN Wort, kleingeschrieben, Einzahl.

taetigkeit  Was damit geschieht. EIN Wort in der Grundform ("reparieren", nicht
            "Reparatur"). Leer lassen, wenn nichts damit geschieht.

klasse      GENAU EINE aus dieser Liste, nichts anderes:
            besitzwechsel  leihe  schenkung
            reparatur  pflege  herstellung  transport
            unterricht  beratung  hilfe  betreuung
            neigung

gebiet      Das Feld, in dem die Sache liegt. EIN Wort.

wer         Die Bezeichnung des Menschen, der hier handelt oder gesucht wird.
            EIN Wort, kleingeschrieben, Einzahl.

            Dieses Feld erschliesst du: auch wenn der Satz die Bezeichnung
            nicht nennt, traegst du sie ein, sobald ein Mensch mit einem Beruf
            oder einem Handwerk gemeint ist.

            Nimm genau das Wort, das ein Mensch eintippen wuerde, der GENAU
            DIESEN sucht. Ein Sammelwort nur dann, wenn es wirklich kein
            genaueres gibt — Woerter wie helfer, handwerker, berater, betreuer,
            techniker, fachkraft, dienstleister, lehrer, anbieter sind fast
            immer zu weit gefasst.

            Erfinde keine Woerter. Nur Bezeichnungen, die es im Sprachgebrauch
            wirklich gibt.

            Leer bleibt das Feld, wenn kein Mensch mit einem Beruf handelt —
            etwa wenn eine Sache den Besitzer wechselt.

gesuchter_beruf  NUR beim Kanal "sucht": die Bezeichnung des Menschen, der dieses
            Problem loest. Der Satz nennt ihn fast nie — du erschliesst ihn.
            EIN Wort, kleingeschrieben, Einzahl.
            Es gelten dieselben Regeln wie bei "wer": genau das Wort, das ein
            Mensch eintippen wuerde, der GENAU DIESEN sucht; ein Sammelwort nur,
            wenn es wirklich kein genaueres gibt; keine erfundenen Woerter.
            Leer bei den anderen Kanaelen — und auch beim Kanal "sucht" dann,
            wenn gar kein Beruf gesucht wird, etwa wenn jemand einen gebrauchten
            Gegenstand kaufen oder Anschluss an eine Gruppe finden will.

merkmal     Stufe, Zustand, Material, professionell oder privat, Zielgruppe.
            Leere Liste, wenn der Satz dazu nichts sagt.

Regeln:
- Was nicht im Satz steht, erfindest du nicht. Ein leeres Feld ist richtig,
  eine erfundene Fuellung ist falsch.
- Davon ausgenommen sind "wer", "gesuchter_beruf" und "schluessel". Dort traegst du auch ein, was
  der Satz nicht woertlich sagt, aber sicher meint. Erfinde keine
  Eigenschaften — benenne den Menschen und die Woerter, unter denen man sucht.
- Bietet der SATZ MEHRERE Dinge an, muessen alle in den Schluesseln stehen.
- Antworte in derselben Reihenfolge, in der die Eintraege kommen, und mit
  genau so vielen Datensaetzen wie Eintraegen.`

/**
 * The vocabulary appendix, filled with the words every community has coined so far.
 *
 * ★★ This is the sentence the whole package exists for. Two members describing the
 * same thing are keyed on different servers, months apart, and only meet if the
 * second one was keyed with the first one's word - so the model has to be shown the
 * list and told to reuse from it, not merely encouraged to be consistent.
 *
 * Appended to the instruction rather than sent as a separate message, because that is
 * how it was measured.
 */
export function vocabularyAppendix(words: readonly string[]): string {
  if (!words.length) {
    return ''
  }
  return `

VORHANDENER WORTSCHATZ
Die folgenden Schluessel sind in dieser Gemeinschaft bereits vergeben.
Passt einer davon zu diesem Eintrag, MUSST du genau ihn verwenden — auch dann,
wenn dir eine andere Form desselben Wortes natuerlicher erschiene.
Ein neues Wort bildest du nur, wenn wirklich keines passt.

${[...words].sort().join(' · ')}`
}

/**
 * How the entries themselves are handed over.
 *
 * The channel travels with the sentence, and it is not decoration: without it the
 * same 588 pairs lost 30 matches. It tells the model whether `gesuchter_beruf`
 * applies at all, and it changes what an ambiguous sentence is read as.
 *
 * The German channel labels are the ones the measurements used - the stored
 * `matchingType` is `offer` / `need` / `interest`, and this is where that becomes the
 * word the model was measured with.
 *
 * Numbered from 1, and the number comes back in `nr`, which is what the answer is
 * matched by - not its position. A call carries one entry, so its number is 1, and a
 * record with any other number belongs to nobody: that is how the record the model
 * makes out of an entry header inside the member's own sentence is dropped (see
 * below).
 *
 * The details follow as a fourth line when the member wrote any - the reading aid the
 * instruction talks about: "Performance-Optimierungen" alone may as well be about
 * sport, and "Beim Programmieren" beside it makes it software. Blank details leave the
 * line out, and the message is then, byte for byte, the one every entry got before the
 * details were read - the one the bank without details was measured with.
 *
 * ⛔ The sentence and the details are put on ONE line each, whatever the member typed -
 * and that guards against one thing only: a newline in their text opening a block of
 * its own. It does NOT stop an entry header written inline. The model reads the
 * structure, not the line breaks: with ten entries in a call, a sentence carrying an
 * entry header of its own took over the next member's entry at every place, 27 times
 * out of 27 (GMS-215), and the words went into the vocabulary every community feeds to
 * its own model. What protects the other members is that a call never carries more
 * than one entry - see `AnthropicClient.keyMatchingEntry` - so the details line only
 * ever stands in its own member's call. With nobody else in the call, the smuggled
 * block came back as a record numbered 2 in the measurement, and is dropped there.
 *
 * Collapsing the whitespace stays anyway: it costs nothing, and the model reads the
 * text the same way.
 */
export const CHANNEL_LABEL: Record<string, string> = {
  offer: 'bietet an',
  need: 'sucht',
  interest: 'interessiert sich fuer',
}

/**
 * How much of the details the model reads: the first 300 characters, once they are on
 * one line. The form takes `MATCHING_ENTRY_DETAILS_MAX_CHARS`, and members still see all
 * of what they wrote; this bounds only what goes into the call.
 *
 * ⚠️ 300 is a decision, not a measurement - no run compared caps. Every gain the details
 * brought in GMS-214 came from details of up to 172 characters, and the longest there
 * ran to a little over 300. The cap bounds the room for stuffing: key words packed into
 * the details are keyed like the sentence's own, which works through the sentence as
 * well - the details only give it more room, and 500 would have nearly doubled it.
 */
const KEYING_DETAILS_MAX_CHARS = 300

export interface KeyableEntry {
  matchingType: string
  summary: string
  /** What the member wrote beside the sentence. NULL or blank when nothing. */
  details: string | null
}

export function keyingUserMessage(entries: readonly KeyableEntry[]): string {
  return entries
    .map((entry, index) => {
      const lines = [
        `EINTRAG ${index + 1}`,
        `Kanal: ${CHANNEL_LABEL[entry.matchingType] ?? entry.matchingType}`,
        `Satz: ${oneLine(entry.summary)}`,
      ]
      const details = detailsForTheModel(entry.details)
      if (details) {
        lines.push(`Details: ${details}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

/** Every run of whitespace, newlines included, becomes one space. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * The details as the model reads them: on one line, cut to `KEYING_DETAILS_MAX_CHARS`,
 * trimmed after the cut. Empty when there are none.
 *
 * Cut at a code point, not at a UTF-16 unit: `Array.from` takes an emoji at the cut
 * whole or not at all, where `slice` on the string would leave half of it behind. The
 * measurement cut the same way.
 */
function detailsForTheModel(details: string | null): string {
  return Array.from(oneLine(details ?? ''))
    .slice(0, KEYING_DETAILS_MAX_CHARS)
    .join('')
    .trim()
}

/**
 * The shape the answer has to have.
 *
 * The German field names are the ones the instruction above talks about; renaming
 * them here would leave the model reading about `schluessel` and asked to produce
 * something else. They are translated to our own names in one place - see
 * `keyedFieldsFromAnswer` - which is also where everything is cleaned and bounded.
 *
 * `nr` rides along because the instruction speaks of several entries, and it is what
 * the answer is matched back by - see `keyingUserMessage`.
 */
export const KEYING_SCHEMA = {
  type: 'object',
  properties: {
    eintraege: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nr: { type: 'integer' },
          schluessel: { type: 'array', items: { type: 'string' } },
          sache: { type: 'string' },
          taetigkeit: { type: 'string' },
          klasse: { type: 'string', enum: [...KEY_CATEGORIES] },
          gebiet: { type: 'string' },
          wer: { type: 'string' },
          merkmal: { type: 'array', items: { type: 'string' } },
          gesuchter_beruf: { type: 'string' },
        },
        required: [
          'nr',
          'schluessel',
          'sache',
          'taetigkeit',
          'klasse',
          'gebiet',
          'wer',
          'merkmal',
          'gesuchter_beruf',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['eintraege'],
  additionalProperties: false,
} as const

/** One record as the model answers, before anything is cleaned or renamed. */
export interface KeyingAnswerRecord {
  nr?: number
  schluessel?: string[]
  sache?: string
  taetigkeit?: string
  klasse?: string
  gebiet?: string
  wer?: string
  merkmal?: string[]
  gesuchter_beruf?: string
}

export interface KeyingAnswer {
  eintraege?: KeyingAnswerRecord[]
}
