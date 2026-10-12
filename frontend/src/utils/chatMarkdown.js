// AI-GENERATED — not an architecture reference
import { memoParts } from '@/utils/memoParts'

/**
 * A chat message read as Markdown (E-078, Bernd, 12.10.2026: texts from working with AI tools
 * come as Markdown, and they should stand in the thread the way they are meant). Every message is
 * read this way; one without any of the signs below comes out as one stretch of text, exactly as
 * it was shown before.
 *
 * ⛔ The text is written by the OTHER side of the conversation. Nothing here makes markup: the
 * result is a tree of plain pieces, and ChatMessageText builds every one of them with h(), as
 * text or as an attribute value. HTML in a message is text. An address becomes a link only
 * where memoParts would have made it one (http, https, ftp -- never `javascript:`), or where it is
 * a `mailto:`.
 *
 * What is read, and where a chat differs from a document:
 * - **Line breaks stay as they are typed.** A document's Markdown joins the lines of a paragraph;
 *   somebody writing a message means the break they typed.
 * - **Blocks:** headings (`# ` to `###### `, with the space -- `#Amstetten` is a word), fenced
 *   code (three backticks; an open fence runs to the end), quotes (`> `, with the space), lists
 *   (`- `, `* `, `1. `, nested by their indent, `[ ]` / `[x]` as boxes), rules (`---`), tables (a
 *   line of cells over a line of dashes).
 * - **In a line:** `**bold**` as before (E-015: anywhere, across lines, the shortest run),
 *   `*italic*` and `_italic_`, `__bold__`, `~~struck~~`, `` `code` ``, `[words](address)`, and an
 *   address in angle brackets.
 *
 * And what a chat message must NOT be taken for -- a chat is full of signs Markdown has a meaning
 * for, and whatever is read as one of them loses its sign:
 * - **No list where somebody wrote a date, signed, or did sums.** A list needs two entries at
 *   least -- "- Bernd" under a greeting is a signature, "1. Mai ist Feiertag" a sentence --, and
 *   right under a line of text a numbered one has to begin with 1: "… am\n12. Oktober\n13.
 *   Oktober" stays what it is. Dashes before numbers only are minus signs ("- 5 Grad", "- 20
 *   GDD"), and "01." is a date's day. A list's numbers are shown as typed.
 * - **No emphasis but around words.** `*`, `_` and `~~` open only where a word begins and close
 *   only where one ends, and what stands between has to hold a word: `2*3*4`, `snake_case`,
 *   `Freund*innen`, `(*)`, `*.*`, `^_^` and `__init__.py` keep their signs. Emphasis, struck
 *   text and code do not reach over a line break (bold does, as before).
 * - **No code where a backtick stands for an apostrophe**: code opens only where no word runs
 *   into the backtick ("wie geht`s? Gibt`s …").
 * - **No quotation where the sign means "more than"** ("> 100 GDD"), or draws an arrow
 *   (">>> Achtung <<<").
 * - **No rule but of dashes.** `*****` is five stars somebody gave, `_ _ _ _` letters to guess.
 * - **No code from indenting**, no heading from a line of `===` or `---` under a text, no
 *   reference definitions: all of that turns ordinary messages into something else. And no
 *   fence of tildes: a line of `~~~~~` is how people draw a line, and it would have made code
 *   of everything under it.
 * - **Nothing is fetched.** `![words](address)` is a link, not a picture: a picture's address
 *   would tell its server who reads the message, and when.
 *
 * ⛔ **A backslash is never taken away.** Before `*`, `_`, `` ` `` or `~` it keeps the sign from
 * meaning anything, as in Markdown -- and stays where it was typed, unlike there: taken away, a
 * path lost its place ("S:\Verein\_Vorlagen", "C:\Bilder\*.jpg") and ¯\_(ツ)_/¯ an arm. A text
 * from an AI tool shows its `snake\_case` with the backslash; nothing is lost by that.
 *
 * @typedef {{ type: 'text', value: string }
 *   | { type: 'url', value: string }
 *   | { type: 'email', value: string }
 *   | { type: 'code', value: string }
 *   | { type: 'bold' | 'italic' | 'strike', parts: ChatInline[] }
 *   | { type: 'link', href: string, parts: ChatInline[] }} ChatInline
 *
 * @typedef {{ type: 'text', inline: ChatInline[] }
 *   | { type: 'heading', level: number, inline: ChatInline[] }
 *   | { type: 'code', lang: string, text: string }  (`lang`: what stands behind the opening fence)
 *   | { type: 'quote', blocks: ChatBlock[] }
 *   | { type: 'list', ordered: boolean, items: { number: number | null, task: boolean | null, blocks: ChatBlock[] }[] }
 *   | { type: 'rule' }
 *   | { type: 'table', align: ('left' | 'center' | 'right' | null)[], head: ChatInline[][], rows: ChatInline[][][] }} ChatBlock
 */

/** How deep quotes and lists may stand in one another; deeper, a line is text. */
const MAX_DEPTH = 6

// ---------------------------------------------------------------------------------- in a line

const WORD = /[\p{L}\p{N}]/u
const isChar = (item) => typeof item === 'string'
const isWord = (item) => isChar(item) && WORD.test(item)
/** The beginning and the end of a line count as space; a piece that is no character does not. */
const isSpace = (item) => item === undefined || (isChar(item) && /\s/.test(item))
/** A piece that stands for something read already: code, a link, an address. */
const isPiece = (item) => item !== undefined && !isChar(item) && item.type !== 'text'
const textOf = (items) => items.map((item) => (isChar(item) ? item : '')).join('')

/** The length of the run of `sign` that begins at `at`. */
const runOf = (items, at, sign) => {
  let length = 0
  while (items[at + length] === sign) length += 1
  return length
}

/** The signs a backslash keeps from meaning anything. */
const SIGNS = new Set(['*', '_', '`', '~'])

/** Where the run of exactly `length` backticks stands that closes code opened before `from`, on the same line; -1 where none does. */
const closingTicks = (chars, from, length) => {
  let j = from
  while (j < chars.length && chars[j] !== '\n') {
    if (chars[j] !== '`') {
      j += 1
      continue
    }
    const run = runOf(chars, j, '`')
    if (run === length) return j
    j += run
  }
  return -1
}

/**
 * Code in a line -- a run of backticks, and the same run again on the same line -- and the signs
 * a backslash keeps from meaning anything. Read in one pass from the left, because each takes
 * the other's signs out of play: a backslash inside code is a backslash, and a backtick behind a
 * backslash opens no code. What stands in code is taken as it is: no emphasis, no address in it.
 *
 * ⛔ Code opens only where no word runs into the backtick: typed for an apostrophe ("wie geht`s?
 * Gibt`s was Neues?") two of them made code of what stood between, and were gone.
 */
const withCode = (chars) => {
  const out = []
  let i = 0
  while (i < chars.length) {
    if (chars[i] === '\\' && SIGNS.has(chars[i + 1])) {
      // The backslash stays (see the head of this file); the sign is a piece of its own, so it
      // is no sign for anything read after this.
      out.push('\\', { type: 'text', value: chars[i + 1] })
      i += 2
      continue
    }
    if (chars[i] !== '`') {
      out.push(chars[i])
      i += 1
      continue
    }
    const open = runOf(chars, i, '`')
    const close = isWord(chars[i - 1]) ? -1 : closingTicks(chars, i + open, open)
    if (close === -1) {
      for (let k = 0; k < open; k += 1) out.push('`')
      i += open
      continue
    }
    let value = chars.slice(i + open, close).join('')
    // One space on either side is the writer's room around a backtick, not part of the code.
    if (value.length > 2 && value.startsWith(' ') && value.endsWith(' ') && value.trim() !== '') {
      value = value.slice(1, -1)
    }
    out.push({ type: 'code', value })
    i = close + open
  }
  return out
}

const WEB_ADDRESS = /^(?:https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;()*']*[-A-Z0-9+&@#/%=~_|()*]$/i
const MAIL_ADDRESS = /^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/** An address a link may lead to, or null. */
const linkTarget = (address) =>
  WEB_ADDRESS.test(address) || MAIL_ADDRESS.test(address) ? address : null

/** Longer than this, what stands in the round brackets is no address. */
const MAX_ADDRESS = 2048

/**
 * Which `]` closes which `[`, line by line -- found once for the whole text: looked for anew at
 * every `[`, a message of nothing but opening brackets took the square of its length.
 */
const squareBrackets = (items) => {
  const closes = new Map()
  let open = []
  items.forEach((item, at) => {
    if (item === '\n') open = []
    else if (item === '[') open.push(at)
    else if (item === ']' && open.length) closes.set(open.pop(), at)
  })
  return closes
}

/** For every place, whether a `)` still follows on its line: where none does, no address ends. */
const roundBracketsAhead = (items) => {
  const ahead = new Array(items.length + 1).fill(false)
  for (let at = items.length - 1; at >= 0; at -= 1) {
    ahead[at] = items[at] !== '\n' && (items[at] === ')' || ahead[at + 1])
  }
  return ahead
}

/**
 * `[words](address)`, `![words](address)` and `<address>`. The words keep their emphasis and
 * their code; the address has to be one a link may lead to, else everything stays as typed.
 */
const withLinks = (items) => {
  const closes = squareBrackets(items)
  const closable = roundBracketsAhead(items)
  const out = []
  let i = 0
  while (i < items.length) {
    const image = items[i] === '!' && items[i + 1] === '['
    const at = image ? i + 1 : i
    if (items[at] === '[') {
      const close = closes.get(at)
      const link = close !== undefined && closable[close + 1] ? linkAt(items, at, close) : null
      if (link) {
        out.push({ type: 'link', href: link.href, parts: emphasised(link.words) })
        i = link.end
        continue
      }
    }
    if (items[i] === '<') {
      let j = i + 1
      while (j < items.length && isChar(items[j]) && !/[\s<>]/.test(items[j])) j += 1
      const address = items.slice(i + 1, j).join('')
      if (items[j] === '>' && j > i + 1 && WEB_ADDRESS.test(address)) {
        out.push({ type: 'url', value: address })
        i = j + 1
        continue
      }
    }
    out.push(items[i])
    i += 1
  }
  return out
}

/**
 * What stands in a link's round brackets without the title that may follow the address after a
 * space, in quotes. Found from the end, by hand: a pattern for it looked back over every space
 * before the quote, and a message of brackets in brackets around a long run of spaces took half
 * a second to read (the second reader, 12.10.2026).
 */
const withoutTitle = (inside) => {
  const quote = inside.at(-1)
  if (quote !== '"' && quote !== "'") return inside
  const opens = inside.lastIndexOf(quote, inside.length - 2)
  return opens > 0 && /\s/.test(inside[opens - 1]) ? inside.slice(0, opens).trimEnd() : inside
}

/** The link whose `[` stands at `at` and is closed at `close`: its words, its address, its end. */
const linkAt = (items, at, close) => {
  if (close === at + 1 || items[close + 1] !== '(') return null
  let j = close + 2
  let round = 1
  const last = Math.min(items.length, j + MAX_ADDRESS)
  while (j < last && isChar(items[j]) && items[j] !== '\n') {
    if (items[j] === '(') round += 1
    if (items[j] === ')') {
      round -= 1
      if (round === 0) break
    }
    j += 1
  }
  if (items[j] !== ')' || round !== 0) return null
  const address = withoutTitle(
    items
      .slice(close + 2, j)
      .join('')
      .trim(),
  ).replace(/^<([^<>\s]*)>$/, '$1')
  const href = linkTarget(address)
  const words = items.slice(at + 1, close)
  if (!href || textOf(words).trim() === '') return null
  return { href, words, end: j + 1 }
}

/** Web and e-mail addresses that stand in the text as they are: the links memoParts finds. */
const withAddresses = (items) => {
  const out = []
  let run = ''
  const flush = () => {
    if (!run) return
    for (const part of memoParts(run)) {
      // Sign by sign, not spread into one call: a long stretch is more than a call takes.
      if (part.type !== 'text') out.push(part)
      else for (const char of part.value) out.push(char)
    }
    run = ''
  }
  for (const item of items) {
    if (isChar(item)) {
      run += item
    } else {
      flush()
      out.push(item)
    }
  }
  flush()
  return out
}

/**
 * Where a run of `sign` stands that closes what was opened before `from` -- on the same line
 * where `line` -- or -1.
 */
const closing = (items, from, sign, { line, closes }) => {
  for (let j = from; j < items.length; j += 1) {
    if (line && items[j] === '\n') return -1
    if (items[j] !== sign) continue
    const run = runOf(items, j, sign)
    if (j > from && closes(j, run)) return j
    j += run - 1
  }
  return -1
}

/** Where the line ends that `from` stands in. */
const lineEnd = (items, from) => {
  let j = from
  while (j < items.length && items[j] !== '\n') j += 1
  return j
}

/** What may stand right before a sign that opens: the beginning of a word. */
const OPENING = new Set([...'([{"\'„“‚‘«»¿¡-–—'])
/** What may stand right behind a sign that closes: the end of a word. */
const CLOSING = new Set([...'.,;:!?)]}"\'“”’«»…-–—'])
/** What a word may end on before the sign that closes: a full stop is part of what was said. */
const ENDING = new Set([...'.,;:!?)]}"\'“”’«»…%€$£°'])
const EMPHASIS = new Set(['*', '_', '~'])

/**
 * Emphasis over a line's pieces: the signs open and close around what stands between them, and
 * what stands between is read the same way -- down to a depth: the text is somebody else's, and
 * a message made of nothing but nested signs is not to keep the reader's window busy.
 *
 * ⛔ `*`, `_`, `__` and `~~` open only where a word begins and close only where one ends, and
 * what they hold has to hold a word. Read more freely -- "not inside a word" was the first rule
 * --, ordinary messages lost their signs (the second reader, 12.10.2026): "Pflichtfelder (*) und
 * Hinweise (*)" both stars, "Lösch alle *.* Dateien" both stars, "^_^ und ^_^" and ":_( … :_("
 * their noses, "Datei __init__.py" its underscores.
 */
const emphasised = (items, depth = 0) => {
  const deep = depth >= MAX_DEPTH
  const within = (inner) => emphasised(inner, depth + 1)
  const parts = []
  let text = ''
  const flush = () => {
    if (text) parts.push({ type: 'text', value: text })
    text = ''
  }
  const push = (part) => {
    flush()
    parts.push(part)
  }

  /** Whether the run of `run` signs at `at` stands where a word begins. */
  const opens = (at, run) => {
    const before = items[at - 1]
    const after = items[at + run]
    return (
      (isSpace(before) || OPENING.has(before) || EMPHASIS.has(before)) &&
      (isWord(after) || isPiece(after) || OPENING.has(after) || EMPHASIS.has(after))
    )
  }
  /** Whether the run of `run` signs at `at` stands where a word ends. */
  const closes = (at, run) => {
    const before = items[at - 1]
    const after = items[at + run]
    // A full stop with a letter behind it stands inside a name: "__init__.py".
    const inName = after === '.' && isWord(items[at + run + 1])
    return (
      (isWord(before) || isPiece(before) || ENDING.has(before) || EMPHASIS.has(before)) &&
      (isSpace(after) || CLOSING.has(after) || EMPHASIS.has(after)) &&
      !inName
    )
  }
  /** Whether a word stands in what the signs would hold: `*.*` and `*_*` hold none. */
  const holdsAWord = (from, to) => {
    for (let at = from; at < to; at += 1) if (isWord(items[at]) || isPiece(items[at])) return true
    return false
  }

  /**
   * Up to where a kind of sign is known to have no partner. Whether a run closes depends on the
   * run alone, so where one opening sign found none, the next one on that stretch finds none
   * either -- and is not sent looking: a message of nothing but opening signs took the square
   * of its length.
   */
  const alone = new Map()
  const closingOf = (kind, from, sign, how) => {
    if (from < (alone.get(kind) ?? 0)) return -1
    const end = closing(items, from, sign, how)
    if (end === -1) alone.set(kind, how.line ? lineEnd(items, from) : items.length)
    return end
  }
  /** The end of what `run` signs of `sign` at `at` hold on their line, or -1. */
  const wordsHeldBy = (at, run, sign) => {
    if (!opens(at, run)) return -1
    const end = closingOf(sign.repeat(run), at + run, sign, {
      line: true,
      closes: (j, r) => r === run && closes(j, r),
    })
    return end !== -1 && holdsAWord(at + run, end) ? end : -1
  }

  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (!isChar(item)) {
      // A sign kept from meaning anything by a backslash is text; every other piece stands as it is.
      if (item.type === 'text') text += item.value
      else push(item)
      i += 1
      continue
    }
    if (item === '*' && !deep) {
      const run = runOf(items, i, '*')
      // Bold and italic at once: three stars, the same three again.
      if (run === 3) {
        const end = wordsHeldBy(i, 3, '*')
        if (end !== -1) {
          push({
            type: 'bold',
            parts: [{ type: 'italic', parts: within(items.slice(i + 3, end)) }],
          })
          i = end + 3
          continue
        }
      }
      // Bold, as it always was (E-015): two stars anywhere, the next two stars, across lines --
      // with something between them.
      if (run >= 2) {
        const end = closingOf('**', i + 2, '*', { line: false, closes: (j, r) => r >= 2 })
        if (end !== -1) {
          push({ type: 'bold', parts: within(items.slice(i + 2, end)) })
          i = end + 2
          continue
        }
      }
      // Italic: one star where a word begins, one where a word ends, on one line.
      if (run === 1) {
        const end = wordsHeldBy(i, 1, '*')
        if (end !== -1) {
          push({ type: 'italic', parts: within(items.slice(i + 1, end)) })
          i = end + 1
          continue
        }
      }
      text += '*'.repeat(run)
      i += run
      continue
    }
    if (item === '_' && !deep) {
      const run = runOf(items, i, '_')
      if (run === 1 || run === 2) {
        const end = wordsHeldBy(i, run, '_')
        if (end !== -1) {
          push({ type: run === 2 ? 'bold' : 'italic', parts: within(items.slice(i + run, end)) })
          i = end + run
          continue
        }
      }
      text += '_'.repeat(run)
      i += run
      continue
    }
    if (item === '~' && !deep) {
      const run = runOf(items, i, '~')
      if (run === 2) {
        const end = wordsHeldBy(i, 2, '~')
        if (end !== -1) {
          push({ type: 'strike', parts: within(items.slice(i + 2, end)) })
          i = end + 2
          continue
        }
      }
      text += '~'.repeat(run)
      i += run
      continue
    }
    text += item
    i += 1
  }
  flush()
  return parts
}

/**
 * The pieces of a stretch of text.
 *
 * @param {string} text
 * @returns {ChatInline[]}
 */
export const chatMarkdownInline = (text) =>
  emphasised(withAddresses(withLinks(withCode([...text]))))

// ------------------------------------------------------------------------------------- blocks

const isBlank = (line) => line.trim() === ''
const indentOf = (line) => line.length - line.trimStart().length
/** A tab at the beginning of a line stands in from the margin as four spaces do. */
const withoutLeadingTabs = (line) =>
  line[0] === '\t' || /^ +\t/.test(line)
    ? line.replace(/^[ \t]+/, (lead) => lead.replace(/\t/g, '    '))
    : line

// ⚠️ Each of these is read from the left without a second way through the same signs: a pattern
// that can give a stretch to either of two parts tries every split of it, and on one long line
// that is the square of its length (`(\S.*?)[ \t]*$`, a word and then anything without a backtick).
// What stands behind an opening fence is kept whole (`lang`) and shown over the code: mostly the
// name of a language, sometimes words somebody wrote there -- and nothing written is left out.
const FENCE = /^ {0,3}(`{3,})([^`]*)$/
const HEADING = /^ {0,3}(#{1,6})[ \t]+(\S.*)$/
const RULE = /^ {0,3}-(?:[ \t]*-){2,}[ \t]*$/
const QUOTE = /^ {0,3}>(?: |$|(?=>))(.*)$/
const ITEM = /^( *)([-*]|(?:0|[1-9]\d{0,8})\.)( +)(\S.*)$/
const TASK = /^\[([ xX])\] +(?=\S)/
const SEPARATOR_CELL = /^:?-+:?$/

/** A heading's words without the signs that may close it ("## Titel ##"): "C#" keeps its sign. */
const headingWords = (typed) => {
  const words = typed.trimEnd()
  let end = words.length
  while (end > 0 && words[end - 1] === '#') end -= 1
  const closed = end < words.length && end > 0 && /[ \t]/.test(words[end - 1])
  return closed ? words.slice(0, end).trimEnd() : words
}

/** What a line says behind the signs that quote it. */
const saidIn = (quoted) => quoted.replace(/^[> ]+/, '')

/**
 * Whether lines that begin with `>` are a quotation, by the first of them that says something:
 * not a number -- "> 100 GDD" is more than a hundred --, and not an arrow drawn both ways (">>>
 * Achtung <<<"). Lines that say nothing at all are no quotation either: it was an empty bubble.
 * Asked of the first line only: a line quoted further down may well begin with a number.
 */
const isAQuotation = (quoted) => {
  const first = quoted.map(saidIn).find((said) => said !== '')
  return first !== undefined && !/^\d/.test(first) && !first.trimEnd().endsWith('<')
}

/**
 * A table's line cut into its cells: at every `|` that no backslash stands before -- and that
 * does not stand in code, which is what the writer meant by the backticks around it.
 */
const cellsOf = (line) => {
  const cells = []
  let cell = ''
  const trimmed = line.trim()
  for (let i = 0; i < trimmed.length; i += 1) {
    if (trimmed[i] === '\\' && trimmed[i + 1] === '|') {
      cell += '|'
      i += 1
    } else if (trimmed[i] === '`') {
      const run = runOf(trimmed, i, '`')
      const close = closingTicks(trimmed, i + run, run)
      const end = close === -1 ? i + run : close + run
      // A bar behind a backslash is a bar there too, as tables are written elsewhere.
      cell += trimmed.slice(i, end).replace(/\\\|/g, '|')
      i = end - 1
    } else if (trimmed[i] === '|') {
      cells.push(cell)
      cell = ''
    } else {
      cell += trimmed[i]
    }
  }
  cells.push(cell)
  // The bars at either end frame the line; they do not make an empty cell.
  if (trimmed.startsWith('|')) cells.shift()
  if (cells.length && trimmed.endsWith('|') && !trimmed.endsWith('\\|')) cells.pop()
  return cells.map((part) => part.trim())
}

const hasBar = (line) => /(^|[^\\])\|/.test(line)

/** The line of dashes under a table's head: how each column is set, or null. */
const separatorOf = (line) => {
  if (!hasBar(line) && !/^\s*:?-+:?\s*$/.test(line)) return null
  const cells = cellsOf(line)
  if (!cells.length || !cells.every((cell) => SEPARATOR_CELL.test(cell))) return null
  return cells.map((cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    return left ? 'left' : null
  })
}

/**
 * A row's cells for a table of `width` columns: empty cells where the row is short, and where it
 * is long the rest in the last cell, as typed -- nothing somebody wrote is left out.
 */
const rowOf = (line, width) => {
  const cells = cellsOf(line)
  if (cells.length > width)
    cells.splice(width - 1, cells.length, cells.slice(width - 1).join(' | '))
  return Array.from({ length: width }, (unused, column) => chatMarkdownInline(cells[column] ?? ''))
}

/** The table that begins at `at`, or null: a line of cells over a line of as many dashes. */
const tableAt = (lines, at) => {
  if (at + 1 >= lines.length || !hasBar(lines[at])) return null
  const align = separatorOf(lines[at + 1])
  const head = cellsOf(lines[at])
  if (!align || align.length !== head.length) return null
  const rows = []
  let next = at + 2
  while (next < lines.length && !isBlank(lines[next]) && hasBar(lines[next])) {
    rows.push(rowOf(lines[next], head.length))
    next += 1
  }
  return { block: { type: 'table', align, head: head.map(chatMarkdownInline), rows }, next }
}

const itemOf = (line) => {
  const found = ITEM.exec(line)
  if (!found) return null
  const [, lead, marker, gap, content] = found
  const ordered = marker !== '-' && marker !== '*'
  return {
    indent: lead.length,
    ordered,
    dash: marker === '-',
    number: ordered ? Number(marker.slice(0, -1)) : null,
    // More than four spaces after the sign are the writer's own; the entry begins after one.
    offset: lead.length + marker.length + (gap.length > 4 ? 1 : gap.length),
    content,
  }
}

/**
 * The list that begins at `at`, as lines: its entries, each with the lines that belong to it --
 * those indented under it. Nothing is read yet; whether this is a list at all is decided on
 * what comes back (blocksOf), and a stretch that is none was not read for nothing.
 */
const listLinesAt = (lines, at) => {
  const first = itemOf(lines[at])
  if (!first || first.indent > 3) return null
  const sameList = (item) =>
    item !== null && item.ordered === first.ordered && Math.abs(item.indent - first.indent) <= 1
  const entries = []
  let next = at
  while (next < lines.length) {
    const item = itemOf(lines[next])
    if (!sameList(item)) break
    const under = Math.min(item.offset, item.indent + 2)
    const more = []
    /** The fence of code open among the entry's lines: how many backticks close it; 0 for none. */
    let fence = FENCE.exec(item.content)?.[1].length ?? 0
    next += 1
    while (next < lines.length) {
      const line = lines[next]
      if (fence) {
        // ⛔ Code between fences belongs to the entry down to its closing fence, however it is
        // indented: people indent the fences and not the code, and a fence left open at the
        // entry's end made code of everything after the list.
        if (new RegExp(`^\`{${fence},}[ \\t]*$`).test(line.trim())) fence = 0
        more.push(line)
        next += 1
        continue
      }
      if (isBlank(line)) {
        let after = next + 1
        while (after < lines.length && isBlank(lines[after])) after += 1
        if (after >= lines.length || indentOf(lines[after]) < under) break
        for (let k = next; k < after; k += 1) more.push('')
        next = after
        continue
      }
      if (indentOf(line) < under) break
      fence = FENCE.exec(line.trimStart())?.[1].length ?? 0
      more.push(line)
      next += 1
    }
    // ⛔ Every line of the entry loses the SAME indent: the least any of them has. Cut each by
    // its own, a point under a point under a numbered entry stood beside its parent -- two
    // spaces were taken from one line and three from the other.
    const least = Math.min(
      item.offset,
      ...more.filter((line) => !isBlank(line)).map((line) => indentOf(line)),
    )
    const own = [item.content, ...more.map((line) => line.slice(Math.min(indentOf(line), least)))]
    const task = item.ordered ? null : TASK.exec(own[0])
    if (task) own[0] = own[0].slice(task[0].length)
    entries.push({ number: item.number, task: task ? task[1] !== ' ' : null, dash: item.dash, own })
    // An empty line between two entries does not end the list.
    let after = next
    while (after < lines.length && isBlank(lines[after])) after += 1
    if (after > next && after < lines.length && sameList(itemOf(lines[after]))) next = after
  }
  return { ordered: first.ordered, entries, next }
}

/**
 * Whether a stretch of entries shows that it is a list: two entries, or one that holds a list
 * itself -- "- Bernd" under a greeting is a signature, and "1. Mai ist Feiertag" a sentence. And
 * not dashes before numbers alone: "- 5 Grad morgens" is five below zero, "- 20 GDD" a sum.
 */
const showsAList = (entries) =>
  (entries.length >= 2 || entries[0].own.slice(1).some((line) => itemOf(line) !== null)) &&
  !entries.every((entry) => entry.dash && /^\d/.test(entry.own[0]))

/**
 * @param {string[]} lines
 * @param {number} depth how deep in quotes and lists these lines stand
 * @param {boolean} inItem whether they are a list entry's own lines
 * @returns {ChatBlock[]}
 */
const blocksOf = (lines, depth, inItem) => {
  const blocks = []
  /** The stretch of ordinary lines being read, its own empty lines among them. */
  let run = []
  const flush = () => {
    while (run.length && isBlank(run[0])) run.shift()
    while (run.length && isBlank(run[run.length - 1])) run.pop()
    if (run.length) blocks.push({ type: 'text', inline: chatMarkdownInline(run.join('\n')) })
    run = []
  }
  /** Whether a line of text stands right above: no empty line between. */
  const underText = () => run.length > 0 && !isBlank(run[run.length - 1])

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = FENCE.exec(line)
    if (fence) {
      flush()
      const [, sign, lang] = fence
      const closes = new RegExp(`^ {0,3}\`{${sign.length},}[ \\t]*$`)
      const code = []
      i += 1
      while (i < lines.length && !closes.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push({ type: 'code', lang: lang.trim(), text: code.join('\n') })
      continue
    }
    if (isBlank(line)) {
      // As typed, with the spaces it may hold: a plain message is shown sign for sign.
      if (run.length) run.push(line)
      i += 1
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        inline: chatMarkdownInline(headingWords(heading[2])),
      })
      i += 1
      continue
    }
    if (RULE.test(line)) {
      flush()
      blocks.push({ type: 'rule' })
      i += 1
      continue
    }
    if (depth < MAX_DEPTH && QUOTE.test(line)) {
      const quoted = []
      let end = i
      while (end < lines.length && QUOTE.test(lines[end])) {
        quoted.push(QUOTE.exec(lines[end])[1])
        end += 1
      }
      if (isAQuotation(quoted)) {
        flush()
        blocks.push({ type: 'quote', blocks: blocksOf(quoted, depth + 1, false) })
      } else {
        // All of them or none: the second line of "more than" is no quotation of its own.
        for (let at = i; at < end; at += 1) run.push(lines[at])
      }
      i = end
      continue
    }
    const table = tableAt(lines, i)
    if (table) {
      flush()
      blocks.push(table.block)
      i = table.next
      continue
    }
    // A list has to show that it is one (showsAList), and right under a line of text a numbered
    // one has to begin with 1: a date there is no list. A list entry's own lines are a document
    // already, and a list among them needs no second entry.
    const numbered = underText() ? itemOf(line) : null
    const date = numbered !== null && numbered.ordered && numbered.number !== 1
    const list = depth < MAX_DEPTH && !date ? listLinesAt(lines, i) : null
    if (list && (inItem || showsAList(list.entries))) {
      flush()
      blocks.push({
        type: 'list',
        ordered: list.ordered,
        items: list.entries.map(({ number, task, own }) => ({
          number,
          task,
          blocks: blocksOf(own, depth + 1, true),
        })),
      })
      i = list.next
      continue
    }
    run.push(line)
    i += 1
  }
  flush()
  return blocks
}

/**
 * A chat message as blocks.
 *
 * @param {string | null | undefined} text
 * @returns {ChatBlock[]}
 */
export const chatMarkdown = (text) => {
  const typed = String(text ?? '').replace(/\r\n?/g, '\n')
  if (typed === '') return []
  const lines = typed.split('\n')
  const read = lines.map(withoutLeadingTabs)
  const blocks = blocksOf(read, 0, false)
  if (blocks.length > 0 && !isPlainChatText(blocks)) return blocks
  // One stretch of text and nothing else -- or nothing but empty lines: the message as it was
  // typed, the empty lines at its ends and its tabs included. What the bubble always showed.
  // (Read a second time only where that differs from what was read above.)
  const asRead =
    blocks.length > 0 &&
    !isBlank(lines[0]) &&
    !isBlank(lines[lines.length - 1]) &&
    read.every((line, at) => line === lines[at])
  return asRead ? blocks : [{ type: 'text', inline: chatMarkdownInline(typed) }]
}

/** Whether a message is one stretch of text and nothing else: shown as it always was. */
export function isPlainChatText(blocks) {
  return blocks.length === 1 && blocks[0].type === 'text'
}
