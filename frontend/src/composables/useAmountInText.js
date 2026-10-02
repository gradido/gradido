// AI-GENERATED — not an architecture reference
import { useI18n } from 'vue-i18n'

/**
 * The amount of a link the way a sentence says it: "20", "12,5", "12,25" -- with the decimal
 * mark of the reader's language, without the two decimals a balance always carries, and
 * without grouping ("1000", as it was typed).
 *
 * The share text that carries a redeem link and the sheet the link opens as name the same
 * amount, so both write it through this. The server hands an amount over as "12.5"; written
 * as it came, a German sentence read "12.5 Gradido".
 *
 * `ungroupedDecimal` is the wallet's own number format, there in every language (i18n.js);
 * only its two fixed decimals are taken back here.
 */
export const useAmountInText = () => {
  const { n } = useI18n()
  return (amount) => n(Number(amount), { key: 'ungroupedDecimal', minimumFractionDigits: 0 })
}
