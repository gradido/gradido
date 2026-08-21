// AI-GENERATED — not an architecture reference

import { computed, ref } from 'vue'
import { formatTypedNumber } from '@/utils/numberFormat'

/**
 * The arithmetic of the Gradido calculator, carried over from the accepted PWA at
 * `gradido-calculator/index.html`.
 *
 * ## The one place this deliberately differs from the original
 *
 * The PWA keeps its expression in the DOM and reads it back out of `innerHTML` to calculate.
 * That works there because it draws numbers in one fixed format. Here the drawing follows
 * the interface language, so a read-back `1.234,50` would be a different number depending on
 * a setting -- and the number in question is one somebody is about to be charged.
 *
 * So the expression lives here, always in dot notation and never grouped, and the display is
 * DERIVED from it. Nothing is ever read back.
 *
 * ## What it does not do
 *
 * It does not play sounds and it does not touch storage. Each entry point returns which
 * sound its path earned, and the page plays it -- which is what makes every branch testable
 * without a Web Audio context, and what keeps the warning tied to the branch that refused
 * the key rather than to a blanket handler.
 */

/** Operators as they are stored, and as they are shown. Stored form is what arithmetic sees. */
const OPERATOR_LABELS = { '+': '+', '-': '−', '*': '×', '/': '÷' }
const SPLIT_ON_OPERATOR = / [+\-*/] /

/**
 * ⛔ A complete number, checked as a WHOLE. `Number.parseFloat` takes the valid prefix and
 * silently drops the rest, so `1.2.3` came back as 1.2 -- and `1.234.567`, which is what a
 * grouped number looks like, came back as 1.234. The guarantee below ("a grouped or
 * comma-decimal string can never be calculated by accident") held for the comma, because a
 * comma fails the character check, and did not hold for the full stop. Now it does.
 *
 * ⚠️ A trailing separator is allowed on purpose: `5.` is a number half typed, and the PWA
 * calculates it too.
 */
const NUMBER_TOKEN = /^\d+\.?\d*$/

/**
 * The Gradido daily rate: the year's decay, counted in whole days since 1 January.
 *
 * ⚠️ This is NOT the running decay the wallet applies to balances. It is the rate a paper
 * DankBar voucher carries, which is why it steps once a day and starts over with the year.
 * Same formula and same constant as the PWA -- see the note in the plan; Bernd confirmed it
 * is to be carried over unchanged.
 */
export const dailyRateFor = (now = new Date()) => {
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const offset = (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000
  const dayOfYear = Math.floor((now - startOfYear + offset) / (1000 * 60 * 60 * 24))
  const dankBarToGdd = 0.998098 ** (dayOfYear - 1)
  return { dankBarToGdd, gddToDankBar: 1 / dankBarToGdd }
}

/** The part of the expression behind the last operator -- the number being typed. */
const currentNumber = (expression) => {
  const parts = expression.split(SPLIT_ON_OPERATOR)
  return parts[parts.length - 1]
}

const replaceCurrentNumber = (expression, next) => {
  const matcher = new RegExp(SPLIT_ON_OPERATOR, 'g')
  let match
  let lastEnd = -1
  while ((match = matcher.exec(expression)) !== null) {
    lastEnd = match.index + match[0].length
  }
  return lastEnd === -1 ? next : expression.slice(0, lastEnd) + next
}

/** Drops leading zeros from the whole part, so `05` becomes `5` but `0.5` stays. */
const withoutLeadingZeros = (raw) => {
  const dot = raw.indexOf('.')
  const whole = dot === -1 ? raw : raw.slice(0, dot)
  const rest = dot === -1 ? '' : raw.slice(dot)
  return whole.replace(/^0+(?=\d)/, '') + rest
}

/**
 * Evaluates the expression. A hand-written parser rather than `eval`, exactly as in the PWA:
 * digits and `+ - * /` only, multiplication before addition, NaN for anything unusable.
 *
 * ⚠️ The character check is also the guard that a grouped or comma-decimal string can never
 * be calculated by accident -- such a string simply fails it and comes back NaN.
 */
export const evaluate = (expression) => {
  if (expression === null || expression === undefined) {
    return NaN
  }
  const source = String(expression).replace(/\s/g, '')
  if (source === '' || !/^[0-9.+\-*/]*$/.test(source)) {
    return NaN
  }

  const tokens = []
  let i = 0
  while (i < source.length) {
    const char = source[i]
    if ('+-*/'.includes(char)) {
      const previous = tokens[tokens.length - 1]
      const isSign = tokens.length === 0 || (previous && previous.op !== undefined)
      if ((char === '+' || char === '-') && isSign) {
        const sign = char === '-' ? -1 : 1
        i += 1
        let digits = ''
        while (i < source.length && /[0-9.]/.test(source[i])) {
          digits += source[i]
          i += 1
        }
        if (!NUMBER_TOKEN.test(digits)) {
          return NaN
        }
        tokens.push({ val: sign * Number.parseFloat(digits) })
      } else {
        tokens.push({ op: char })
        i += 1
      }
    } else if (/[0-9.]/.test(char)) {
      let digits = ''
      while (i < source.length && /[0-9.]/.test(source[i])) {
        digits += source[i]
        i += 1
      }
      if (!NUMBER_TOKEN.test(digits)) {
        return NaN
      }
      tokens.push({ val: Number.parseFloat(digits) })
    } else {
      return NaN
    }
  }
  if (tokens.length === 0 || tokens[0].val === undefined) {
    return NaN
  }

  const level = [tokens[0]]
  for (let k = 1; k < tokens.length; k += 2) {
    const operator = tokens[k]
    const right = tokens[k + 1]
    if (!operator || operator.op === undefined || !right || right.val === undefined) {
      return NaN
    }
    if (operator.op === '*' || operator.op === '/') {
      const left = level[level.length - 1]
      left.val = operator.op === '*' ? left.val * right.val : left.val / right.val
    } else {
      level.push(operator, right)
    }
  }

  let total = level[0].val
  for (let k = 1; k < level.length; k += 2) {
    const operator = level[k]
    const right = level[k + 1]
    if (!operator || operator.op === undefined || !right || right.val === undefined) {
      return NaN
    }
    total = operator.op === '+' ? total + right.val : total - right.val
  }
  return Number.isFinite(total) ? total : NaN
}

/**
 * @param percent  reactive Gradido share, 0..100
 * @param factor   reactive purchasing-power factor: 1 GDD = factor x local currency
 * @param locale   reactive interface language, for drawing only
 */
export const useCalculator = ({ percent, factor, locale }) => {
  const expression = ref('')
  const justCalculated = ref(false)
  const subResult = ref(null)
  /**
   * The only way the expression is written: moving the calculation on takes the sums under
   * the display with it, and everything that hangs off them -- the card button, the copy
   * buttons -- goes in the same stroke.
   *
   * ⛔ This deliberately DIVERGES from the PWA, which leaves the sums standing until AC
   * ("Ergebnisse unten NICHT loeschen", index.html). There the standing line was a piece of
   * information and cost nothing; here actions hang off it, and a sub-line showing the
   * previous customer's sums under a new customer's digits is only ever misread. Bernd
   * revised the original behaviour on 20.08.2026: what the display no longer shows, the
   * sums no longer claim. Do not bring the standing sums back.
   */
  const setExpression = (next) => {
    expression.value = next
    subResult.value = null
  }

  const display = computed(() => {
    if (expression.value === '') {
      return ''
    }
    const numbers = expression.value.split(SPLIT_ON_OPERATOR)
    // The operators, in the order they were split out. They are drawn the way the KEYS are
    // labelled, not the way they are stored -- somebody who pressed x should read x.
    const operators = expression.value.match(new RegExp(SPLIT_ON_OPERATOR, 'g')) || []
    let drawn = formatTypedNumber(numbers[0], locale.value)
    for (let i = 1; i < numbers.length; i += 1) {
      const operator = (operators[i - 1] || '').trim()
      drawn += ` ${OPERATOR_LABELS[operator] ?? operator} ${formatTypedNumber(numbers[i], locale.value)}`
    }
    return drawn
  })

  /** The Gradido sum worth handing to a card payment -- of the calculation on screen NOW. */
  const payableGdd = computed(() =>
    subResult.value?.kind === 'payment' && subResult.value.gdd > 0 ? subResult.value.gdd : null,
  )

  const appendDigit = (digit) => {
    if (justCalculated.value) {
      justCalculated.value = false
      setExpression('')
    }
    const current = currentNumber(expression.value)
    const dot = current.indexOf('.')
    if (dot !== -1 && current.length - dot - 1 >= 2) {
      return 'warn' // two decimals is what the currency has; a third is refused, as in the PWA
    }
    setExpression(
      replaceCurrentNumber(expression.value, withoutLeadingZeros(current + String(digit))),
    )
    return 'digit'
  }

  const appendSeparator = () => {
    if (justCalculated.value) {
      justCalculated.value = false
      setExpression('')
    }
    const current = currentNumber(expression.value)
    if (current.includes('.')) {
      return 'warn'
    }
    // "0." rather than ".", so the number reads as one before anything follows it
    setExpression(replaceCurrentNumber(expression.value, `${current === '' ? '0' : current}.`))
    return 'digit'
  }

  const appendOperator = (operator) => {
    // An operator after "=" carries on with the result instead of starting over.
    justCalculated.value = false
    const current = currentNumber(expression.value)
    if (current === '' || current.endsWith('.')) {
      return 'warn'
    }
    if (expression.value.endsWith(' ')) {
      return 'warn'
    }
    setExpression(`${expression.value} ${operator} `)
    return 'function'
  }

  const deleteLast = () => {
    justCalculated.value = false
    if (expression.value === '') {
      return 'warn'
    }
    if (expression.value.endsWith(' ')) {
      setExpression(expression.value.slice(0, -3))
    } else {
      const current = currentNumber(expression.value)
      setExpression(replaceCurrentNumber(expression.value, current.slice(0, -1)))
    }
    return 'function'
  }

  const allClear = () => {
    setExpression('')
    justCalculated.value = false
    return 'function'
  }

  /**
   * ⚠️ The result is put back into the expression rounded to two decimals, which is what the
   * PWA does by writing its formatted result into the display and reading it back. Carrying
   * on from a result therefore carries on from the number that was SHOWN -- the same
   * arithmetic somebody would get with pen and paper, and not a hidden longer one.
   */
  const calculate = () => {
    const value = evaluate(expression.value)
    if (Number.isNaN(value)) {
      return 'warn'
    }
    setExpression(value.toFixed(2))
    justCalculated.value = true

    if (percent.value > 0) {
      const rate = dailyRateFor()
      const fiat = (value * (100 - percent.value)) / 100
      const gdd = (value - fiat) / factor.value
      subResult.value = { kind: 'payment', fiat, gdd, dankBar: rate.gddToDankBar * gdd, rate }
    } else {
      subResult.value = null
    }
    return 'equals'
  }

  /** Turns an amount of paper DankBar into Gradido at today's rate. */
  const dankBarToGdd = () => {
    const value = evaluate(expression.value)
    if (Number.isNaN(value)) {
      return 'warn'
    }
    setExpression(value.toFixed(2))
    justCalculated.value = true
    const rate = dailyRateFor()
    subResult.value = { kind: 'dankbar', dankBar: value, gdd: value * rate.dankBarToGdd, rate }
    return 'function'
  }

  /**
   * The whole basket, as one plain object — for the round trip to the scanner. The park
   * act navigates away, which unmounts the page and with it these refs; only what was
   * written down comes back (Bernd, 21.08.2026: the WHOLE basket survives, not just the
   * parked amount — the fiat sum still to collect lives nowhere else).
   */
  const snapshot = () => ({
    expression: expression.value,
    justCalculated: justCalculated.value,
    subResult: subResult.value,
  })

  /** Every number a stored sub-result carries, per kind — the restore validator's map. */
  const SUB_RESULT_NUMBERS = {
    payment: ['fiat', 'gdd', 'dankBar'],
    dankbar: ['dankBar', 'gdd'],
  }

  const isRestorableSubResult = (sub) => {
    if (sub === null) {
      return true
    }
    const numbers = SUB_RESULT_NUMBERS[sub?.kind]
    return (
      Boolean(numbers) &&
      numbers.every((field) => Number.isFinite(sub[field])) &&
      Number.isFinite(sub.rate?.dankBarToGdd) &&
      Number.isFinite(sub.rate?.gddToDankBar)
    )
  }

  /**
   * Puts a snapshot back. Storage content is the user's own, but it went through
   * serialization and a page's lifetime — anything that does not hold the shape is
   * refused whole rather than half-restored: a basket is either the one that was
   * parked, or none.
   *
   * @returns {boolean} whether the snapshot was taken
   */
  const restore = (saved) => {
    if (
      !saved ||
      typeof saved.expression !== 'string' ||
      typeof saved.justCalculated !== 'boolean' ||
      !isRestorableSubResult(saved.subResult)
    ) {
      return false
    }
    expression.value = saved.expression
    justCalculated.value = saved.justCalculated
    subResult.value = saved.subResult
    return true
  }

  return {
    display,
    subResult,
    payableGdd,
    appendDigit,
    appendSeparator,
    appendOperator,
    deleteLast,
    allClear,
    calculate,
    dankBarToGdd,
    snapshot,
    restore,
  }
}
