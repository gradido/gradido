// AI-GENERATED — not an architecture reference
/**
 * vue-i18n's default rule reads a two-form message as [one | other] and a three-form one as
 * [zero | one | other]. Russian counts in three classes of its own -- one (1, 21, 31 …),
 * few (2–4, 22–24 …), many (0, 5–20, 25–30 …) -- so a three-form Russian message is written
 * [one | few | many] and this rule picks among them. Without it, "1 операции" and
 * "2 операций" reach the screen.
 *
 * Two-form messages keep the default reading (1 → first form, everything else → second),
 * so the Russian keys that already exist with two forms stand as they are.
 *
 * ⚠️ It applies to EVERY Russian message with forms, the existing ones included. There was
 * one three-form key before this (`link-load`), and it was written for the default reading:
 * its caller asked for the singular by passing the count 0, which this rule reads as "many".
 * The caller passes 1 now -- which is what it means, and what German and English needed too
 * (they rendered "die letzten 0 Links nachladen" before). Measured, not deduced.
 */
export const slavicPlural = (choice, choicesLength) => {
  // Absolute first, exactly as vue-i18n's own rule does -- a message translated without a
  // count arrives as -1, and it has to land on the singular there, not on the plural.
  const n = Math.abs(choice)
  if (choicesLength < 3) {
    return n === 1 ? 0 : 1
  }
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 0
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
  return 2
}

export const pluralRules = { ru: slavicPlural }
