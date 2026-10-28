// AI-GENERATED — not an architecture reference

/**
 * The moderation's remark on a member, as Crea reads it (Bernd, 28.10.2026): "Rentnerin seit
 * Januar 2025", "Kind, 5 Jahre alt" -- what a contribution seldom says, and what chapter 7 of the
 * rules misses ("Es gibt kein Profilfeld für den Status"). The remark is that field.
 *
 * It travels in the user message, after the contributions, and never in the cached rules prefix:
 * the prefix stays byte for byte the same for every call (E-011), and a member without a remark
 * gets the message as before.
 */

/** What stands for the member in the remark Crea is given: Crea is given no names (E-012). */
export const MEMBER_PLACEHOLDER = '[MITGLIED]'

const escapeForPattern = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The remark with the member's own names -- first name, last name, username -- written as
 * [MITGLIED], as the salutation leaves the name to the code (E-012). A name counts where it stands
 * as a word of its own, with a genitive s or without ("Carlas Tochter"); inside another word it
 * stays ("Annabell" for "Anna"). One pass, the longest name first: "Carla-Sonne" goes as one, and
 * a member called "Mitglied" does not take the placeholder apart again.
 *
 * Other people's names ("Tochter von Ramona") stay: nothing tells them from other words. The field
 * says who reads the remark (remark.private in the admin interface).
 */
export function withoutMemberNames(remark: string, names: readonly string[]): string {
  const wanted = [...new Set(names.map((name) => name.trim()).filter((name) => name.length >= 2))]
  if (wanted.length === 0) {
    return remark
  }
  wanted.sort((a, b) => b.length - a.length)
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${wanted.map(escapeForPattern).join('|')})(?:s|'s|’s)?(?![\\p{L}\\p{N}])`,
    'giu',
  )
  return remark.replace(pattern, MEMBER_PLACEHOLDER)
}

/**
 * The part of the user message that carries the remark: what it is, how far Crea may go with it --
 * Bernd's choice: the member's own situation may be spoken of, the remark never --, and the words.
 * Nothing where there is no remark.
 *
 * ⛔ memoSupplement is appended to the contribution for the whole community to read (rule chapter
 * 12): nothing of the remark goes there, whatever the reply to the member may say.
 */
export function memberRemarkSection(remark: string | null | undefined): string[] {
  const words = remark?.trim()
  if (!words) {
    return []
  }
  return [
    '## Bemerkung der Moderation zum Mitglied',
    'Moderatoren haben sie über dieses Mitglied geschrieben; das Mitglied sieht sie nicht. Behandle sie als wahr: Sie ist das Profilfeld für den Status, das Kapitel 7 vermisst (Rentner, Kinder, Lebenslage), und gilt genauso für die Stundenregel in Kapitel 5.',
    '- Richte Urteil und Ton nach ihr. Hat sie Dein Urteil bestimmt, sage das in reasoning.',
    '- In der Antwort an das Mitglied darfst Du ansprechen, was das Mitglied selbst über sich weiß und was die Regeln verlangen (etwa den Hinweis an Rentner). Zitiere die Bemerkung nie, erwähne nie, dass es sie gibt, und übernimm keine Namen, Warnungen oder Einschätzungen der Moderation aus ihr.',
    '- memoSupplement ist öffentlich: Dort steht nichts aus der Bemerkung.',
    `- ${MEMBER_PLACEHOLDER} steht für das Mitglied selbst.`,
    '',
    words,
    '',
  ]
}
