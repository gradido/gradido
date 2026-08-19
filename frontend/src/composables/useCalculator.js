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
        if (digits === '' || Number.isNaN(Number.parseFloat(digits))) {
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
      if (Number.isNaN(Number.parseFloat(digits))) {
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
  const rate = dailyRateFor()

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

  /** True once there is a result worth handing to a card payment. */
  const payableGdd = computed(() =>
    subResult.value?.kind === 'payment' && subResult.value.gdd > 0 ? subResult.value.gdd : null,
  )

  const appendDigit = (digit) => {
    if (justCalculated.value) {
      justCalculated.value = false
      expression.value = ''
    }
    const current = currentNumber(expression.value)
    const dot = current.indexOf('.')
    if (dot !== -1 && current.length - dot - 1 >= 2) {
      return 'warn' // two decimals is what the currency has; a third is refused, as in the PWA
    }
    expression.value = replaceCurrentNumber(
      expression.value,
      withoutLeadingZeros(current + String(digit)),
    )
    return 'digit'
  }

  const appendSeparator = () => {
    if (justCalculated.value) {
      justCalculated.value = false
      expression.value = ''
    }
    const current = currentNumber(expression.value)
    if (current.includes('.')) {
      return 'warn'
    }
    // "0." rather than ".", so the number reads as one before anything follows it
    expression.value = replaceCurrentNumber(expression.value, `${current === '' ? '0' : current}.`)
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
    expression.value += ` ${operator} `
    return 'function'
  }

  const deleteLast = () => {
    justCalculated.value = false
    if (expression.value === '') {
      return 'warn'
    }
    if (expression.value.endsWith(' ')) {
      expression.value = expression.value.slice(0, -3)
    } else {
      const current = currentNumber(expression.value)
      expression.value = replaceCurrentNumber(expression.value, current.slice(0, -1))
    }
    return 'function'
  }

  const allClear = () => {
    expression.value = ''
    subResult.value = null
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
    expression.value = value.toFixed(2)
    justCalculated.value = true

    if (percent.value > 0) {
      const fiat = (value * (100 - percent.value)) / 100
      const gdd = (value - fiat) / factor.value
      subResult.value = { kind: 'payment', fiat, gdd, dankBar: rate.gddToDankBar * gdd }
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
    expression.value = value.toFixed(2)
    justCalculated.value = true
    subResult.value = { kind: 'dankbar', dankBar: value, gdd: value * rate.dankBarToGdd }
    return 'function'
  }

  return {
    display,
    subResult,
    payableGdd,
    rate,
    appendDigit,
    appendSeparator,
    appendOperator,
    deleteLast,
    allClear,
    calculate,
    dankBarToGdd,
  }
}
