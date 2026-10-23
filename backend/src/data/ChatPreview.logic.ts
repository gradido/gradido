// AI-GENERATED — not an architecture reference

/**
 * The line under a person's name on "Kontakte & Chat" (E-083): of the latest message and the
 * latest booking with them, the one that came later -- Bernd's choice, a booking counts as the
 * latest word too --, null where there is neither. The message where both have the same moment:
 * it says more than an amount.
 */
export const laterChatPreview = <T extends { at: Date }>(
  message: T | null,
  booking: T | null,
): T | null => {
  if (message === null) {
    return booking
  }
  if (booking === null) {
    return message
  }
  return booking.at.getTime() > message.at.getTime() ? booking : message
}

/**
 * The words a message's line begins with (E-083): its subject and its text, as the bubble shows
 * them one under the other -- the subject of a message sent from the e-mail form first --, and as
 * "Kopieren" copies them. Empty parts are left out; the wallet puts it all on one line.
 */
export const chatPreviewWords = (subject: string | null, body: string): string =>
  [subject, body].filter((part): part is string => Boolean(part?.trim())).join('\n\n')
