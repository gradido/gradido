// AI-GENERATED — not an architecture reference

/**
 * The length the remark's field lets through: the server's number (UserRemark.logic.test.ts holds
 * the two together). `maxlength` counts UTF-16 units, the server characters: the field is stricter.
 */
export const USER_REMARK_MAX_CHARS = 2000

/** What the server keeps of these words: whitespace alone takes the remark away. */
export const asKept = (text: string) => (text.trim() === '' ? '' : text)
