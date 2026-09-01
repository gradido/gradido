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
 * `gms176` is the measurement this text comes from - one call per entry, with the
 * profession question folded in rather than asked separately.
 */
export const KEYING_INSTRUCTION_VERSION = 'gms176-1'

/**
 * What the model is asked to do with one entry.
 *
 * ⛔ This text is not to be tidied. It is the wording that was measured over 588
 * offer/need pairs, and the numbers the whole plan rests on - 89 % of pairs found
 * when the two halves arrive months apart - are numbers about THIS text. Any edit is
 * a new experiment and needs a new version above.
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
 */
export const KEYING_INSTRUCTION = `Du arbeitest Eintraege einer Nachbarschafts-Plattform zu Suchdatensaetzen aus.
Jeder Eintrag ist ein Satz, den ein Mensch geschrieben hat, dazu ein Kanal
(bietet an / sucht / interessiert sich fuer).

Auf dieser Plattform suchen Menschen einander. Wer Hilfe braucht, tippt fast
immer die Bezeichnung des MENSCHEN, den er sucht — nicht die der Taetigkeit.

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
- Bietet ein Eintrag MEHRERE Dinge an, muessen alle in den Schluesseln stehen.
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
 * matched by. Matching by position instead would mean that a model dropping the third
 * record hands the fourth entry's words to the third entry - keys that look right and
 * are about somebody else's sentence.
 *
 * ⛔ And the sentence is put on ONE line, whatever the member typed. It is their own
 * free text, it sits inside a structure whose blocks are separated by blank lines,
 * and `nr` is the only thing tying an answer back to an entry - so a member who
 * writes a newline followed by their own `EINTRAG 2` block can hand a second member's
 * entry whatever words they like. Those words then go into the vocabulary EVERY
 * community feeds to its own model. Collapsing the whitespace costs nothing: a
 * summary is one short sentence, and the model reads it the same way.
 */
export const CHANNEL_LABEL: Record<string, string> = {
  offer: 'bietet an',
  need: 'sucht',
  interest: 'interessiert sich fuer',
}

export interface KeyableEntry {
  matchingType: string
  summary: string
}

export function keyingUserMessage(entries: readonly KeyableEntry[]): string {
  return entries
    .map(
      (entry, index) =>
        `EINTRAG ${index + 1}\nKanal: ${CHANNEL_LABEL[entry.matchingType] ?? entry.matchingType}\nSatz: ${oneLine(entry.summary)}`,
    )
    .join('\n\n')
}

/** Every run of whitespace, newlines included, becomes one space. */
function oneLine(summary: string): string {
  return summary.replace(/\s+/g, ' ').trim()
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
