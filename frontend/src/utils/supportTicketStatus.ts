// AI-GENERATED — not an architecture reference

/**
 * The colour and the sign of a support request's state (SUA-007, SUA-017): open blue with a bell,
 * a question back blue as well, with a question mark -- the member is to answer --, closed green,
 * deleted red. The rows of "Meine Anfragen" and the legend beside them draw the same.
 */
export const SUPPORT_TICKET_SIGNS: Record<string, { variant: string; icon: string }> = {
  OPEN: { variant: 'primary', icon: 'bell-fill' },
  IN_PROGRESS: { variant: 'primary', icon: 'question' },
  CLOSED: { variant: 'success', icon: 'check' },
  DELETED: { variant: 'danger', icon: 'trash' },
}
