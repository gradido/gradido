// AI-GENERATED — not an architecture reference

/** The three tabs of the send form: a transfer, a link, a letter. */
export const SEND_TYPES = {
  send: 'send',
  link: 'link',
  email: 'email',
} as const

export type SendType = (typeof SEND_TYPES)[keyof typeof SEND_TYPES]
